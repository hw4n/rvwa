/* eslint-disable @typescript-eslint/no-explicit-any */
import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { ConvexError, v } from "convex/values";
import {
  INPUT_LIMITS,
  assertNormalizedSlug,
  canReadReview,
  getViewerDoc,
  normalizeSlug,
  nowIso,
  requireAdmin,
  sanitizeOptionalText,
  sanitizeRequiredText,
  sanitizeAttributes,
  sanitizeTagList,
  toCategory,
  toNode,
  toReview,
} from "./helpers";

export const getView = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const node = await ctx.db
      .query("nodes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!node) {
      return null;
    }

    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", node.categorySlug))
      .unique();
    const children = await ctx.db
      .query("nodes")
      .withIndex("by_parent", (q) => q.eq("parentId", node._id))
      .collect();
    const rawReviews = await ctx.db
      .query("reviews")
      .withIndex("by_node", (q) => q.eq("nodeId", node._id))
      .collect();
    const viewer = await getViewerDoc(ctx);

    const reviews = await Promise.all(
      rawReviews
        .filter((review) => canReadReview(viewer as any, review as any))
        .sort((a, b) => {
          const recommendDiff = (b.recommendCount ?? 0) - (a.recommendCount ?? 0);
          if (recommendDiff !== 0) {
            return recommendDiff;
          }

          return b.updatedAt.localeCompare(a.updatedAt);
        })
        .map((review) => toReview(ctx, review as any))
    );

    const trail = [];
    let current = node;
    while (current) {
      trail.unshift(toNode(current as any));
      current = current.parentId ? await ctx.db.get(current.parentId) : null;
    }

    return {
      node: toNode(node as any),
      category: category ? toCategory(category as any) : null,
      children: children.map((child) => toNode(child as any)),
      trail,
      reviews,
    };
  },
});

export const create = mutation({
  args: {
    categorySlug: v.string(),
    title: v.string(),
    slug: v.string(),
    summary: v.string(),
    coverImage: v.optional(v.string()),
    tags: v.array(v.string()),
    parentId: v.optional(v.id("nodes")),
    attributes: v.record(v.string(), v.any()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const slug = assertNormalizedSlug(args.slug || args.title, "Item slug");

    if (!slug) {
      throw new ConvexError("항목 slug를 입력해주세요.");
    }

    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.categorySlug))
      .unique();

    if (!category) {
      throw new ConvexError("카테고리를 찾을 수 없습니다. 페이지를 새로고침해주세요.");
    }

    const fieldDefinitions = category.fieldDefinitions ?? [];

    const existing = await ctx.db
      .query("nodes")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (existing) {
      throw new ConvexError("같은 slug의 항목이 이미 있습니다. 다른 slug를 입력해주세요.");
    }

    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent || parent.categorySlug !== args.categorySlug) {
        throw new ConvexError("선택한 상위 항목이 올바르지 않습니다.");
      }
    }

    const timestamp = nowIso();
    const nodeId = await ctx.db.insert("nodes", {
      slug,
      title: sanitizeRequiredText(args.title, "Item title", INPUT_LIMITS.nodeTitle),
      categorySlug: args.categorySlug,
      parentId: args.parentId,
      summary: sanitizeOptionalText(args.summary, "Item summary", INPUT_LIMITS.nodeSummary) ?? "",
      status: undefined,
      coverImage: sanitizeOptionalText(args.coverImage, "Cover image URL", 500),
      attributes: sanitizeAttributes(args.attributes, fieldDefinitions),
      externalRefs: [],
      tagSlugs: sanitizeTagList(args.tags),
      createdBy: admin._id as any,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return { nodeId, slug };
  },
});

export const update = mutation({
  args: {
    currentSlug: v.string(),
    categorySlug: v.string(),
    title: v.string(),
    slug: v.string(),
    summary: v.string(),
    coverImage: v.optional(v.string()),
    tags: v.array(v.string()),
    parentId: v.optional(v.id("nodes")),
    attributes: v.record(v.string(), v.any()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const currentSlug = normalizeSlug(args.currentSlug);
    const nextSlug = assertNormalizedSlug(args.slug || args.title, "Item slug");

    if (!currentSlug || !nextSlug) {
      throw new ConvexError("항목 slug를 입력해주세요.");
    }

    const node = await ctx.db
      .query("nodes")
      .withIndex("by_slug", (q) => q.eq("slug", currentSlug))
      .unique();

    if (!node) {
      throw new ConvexError("항목을 찾을 수 없습니다.");
    }

    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.categorySlug))
      .unique();

    if (!category) {
      throw new ConvexError("카테고리를 찾을 수 없습니다. 페이지를 새로고침해주세요.");
    }

    const fieldDefinitions = category.fieldDefinitions ?? [];

    if (nextSlug !== currentSlug) {
      const existing = await ctx.db
        .query("nodes")
        .withIndex("by_slug", (q) => q.eq("slug", nextSlug))
        .unique();

      if (existing) {
        throw new ConvexError("같은 slug의 항목이 이미 있습니다. 다른 slug를 입력해주세요.");
      }
    }

    if (args.parentId) {
      if (args.parentId === node._id) {
        throw new ConvexError("선택한 상위 항목이 올바르지 않습니다.");
      }

      const parent = await ctx.db.get(args.parentId);
      if (!parent || parent.categorySlug !== args.categorySlug) {
        throw new ConvexError("선택한 상위 항목이 올바르지 않습니다.");
      }
    }

    const timestamp = nowIso();
    await ctx.db.patch(node._id, {
      slug: nextSlug,
      title: sanitizeRequiredText(args.title, "Item title", INPUT_LIMITS.nodeTitle),
      categorySlug: args.categorySlug,
      parentId: args.parentId,
      summary: sanitizeOptionalText(args.summary, "Item summary", INPUT_LIMITS.nodeSummary) ?? "",
      coverImage: sanitizeOptionalText(args.coverImage, "Cover image URL", 500),
      attributes: sanitizeAttributes(args.attributes, fieldDefinitions),
      tagSlugs: sanitizeTagList(args.tags),
      updatedAt: timestamp,
    });

    return { nodeId: node._id, slug: nextSlug };
  },
});

export const remove = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const slug = normalizeSlug(args.slug);

    if (!slug) {
      throw new ConvexError("항목 slug를 입력해주세요.");
    }

    const node = await ctx.db
      .query("nodes")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (!node) {
      throw new ConvexError("항목을 찾을 수 없습니다.");
    }

    const timestamp = nowIso();
    const children = await ctx.db
      .query("nodes")
      .withIndex("by_parent", (q) => q.eq("parentId", node._id))
      .collect();

    for (const child of children) {
      await ctx.db.patch(child._id, {
        parentId: undefined,
        updatedAt: timestamp,
      });
    }

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_node", (q) => q.eq("nodeId", node._id))
      .collect();

    for (const review of reviews) {
      await ctx.db.patch(review._id, {
        nodeId: undefined,
        updatedAt: timestamp,
      });
    }

    await ctx.db.delete(node._id);

    return { categorySlug: node.categorySlug };
  },
});

export const listIndex = query({
  args: {},
  handler: async (ctx) => {
    const nodes = await ctx.db.query("nodes").collect();

    return nodes
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((node) => toNode(node as any));
  },
});
