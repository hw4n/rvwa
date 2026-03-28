/* eslint-disable @typescript-eslint/no-explicit-any */
import { mutationGeneric as mutation, paginationOptsValidator, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { normalizeStoredRating } from "../lib/review-rating";
import {
  INPUT_LIMITS,
  assertExplicitSlug,
  normalizeSlug,
  nowIso,
  requireAdmin,
  sanitizeFieldDefinitions,
  sanitizeRequiredText,
  toCategory,
  toNode,
} from "./helpers";

const UNCATEGORIZED_SLUG = "uncategorized";
const metadataFieldDefinitionValidator = v.object({
  key: v.string(),
  label: v.string(),
  type: v.union(v.literal("text"), v.literal("number"), v.literal("boolean"), v.literal("list")),
});

async function ensureUncategorizedCategory(ctx: any, adminId: any) {
  const existing = await ctx.db
    .query("categories")
    .withIndex("by_slug", (q: any) => q.eq("slug", UNCATEGORIZED_SLUG))
    .unique();

  if (existing) {
    return existing;
  }

  const timestamp = nowIso();
  const categoryId = await ctx.db.insert("categories", {
    slug: UNCATEGORIZED_SLUG,
    name: "미분류",
    description: "미분류",
    icon: "folder",
    fieldDefinitions: [],
    createdBy: adminId,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return await ctx.db.get(categoryId);
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return categories
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((category) => toCategory(category as any));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    return category ? toCategory(category as any) : null;
  },
});

export const getView = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!category) {
      return null;
    }

    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_category", (q) => q.eq("categorySlug", category.slug))
      .collect();
    const roots = nodes.filter((node) => !node.parentId);

    const reviewGroups = await Promise.all(
      nodes.map(async (node) => ({
        nodeId: node._id,
        reviews: await ctx.db
          .query("reviews")
          .withIndex("by_node", (q) => q.eq("nodeId", node._id))
          .collect(),
      }))
    );

    const approvedReviews = reviewGroups
      .flatMap((group) => group.reviews)
      .filter((review) => review.status === "approved");

    const averageRatings = new Map<string, number>();
    for (const group of reviewGroups) {
      const values = group.reviews
        .filter((review) => review.status === "approved")
        .map((review) => normalizeStoredRating(review.rating))
        .filter((rating): rating is number => typeof rating === "number");

      if (!values.length) {
        continue;
      }

      averageRatings.set(
        group.nodeId,
        Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 1000) / 1000
      );
    }

    const tags = new Map<string, number>();
    for (const node of nodes) {
      for (const tag of node.tagSlugs) {
        tags.set(tag, (tags.get(tag) ?? 0) + 1);
      }
    }

    const topTags = [...tags.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([slug, count]) => ({ slug, count }));

    return {
      category: toCategory(category as any),
      nodes: nodes.map((node) =>
        toNode({
          ...(node as any),
          rating: averageRatings.get(node._id),
        })
      ),
      roots: roots.map((node) =>
        toNode({
          ...(node as any),
          rating: averageRatings.get(node._id),
        })
      ),
      nodeCount: nodes.length,
      reviewCount: approvedReviews.length,
      topTags,
    };
  },
});

export const listRootsPage = query({
  args: {
    slug: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!category) {
      throw new Error("Category not found");
    }

    const page = await ctx.db
      .query("nodes")
      .withIndex("by_category", (q) => q.eq("categorySlug", category.slug))
      .paginate(args.paginationOpts);

    const roots = page.page.filter((node) => !node.parentId);
    const averageRatings = new Map<string, number>();

    await Promise.all(
      roots.map(async (node) => {
        const reviews = await ctx.db
          .query("reviews")
          .withIndex("by_node", (q) => q.eq("nodeId", node._id))
          .collect();

        const values = reviews
          .filter((review) => review.status === "approved")
          .map((review) => normalizeStoredRating(review.rating))
          .filter((rating): rating is number => typeof rating === "number");

        if (!values.length) {
          return;
        }

        averageRatings.set(
          node._id,
          Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 1000) / 1000
        );
      })
    );

    return {
      ...page,
      page: roots.map((node) =>
        toNode({
          ...(node as any),
          rating: averageRatings.get(node._id),
        })
      ),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    icon: v.string(),
    fieldDefinitions: v.array(metadataFieldDefinitionValidator),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (args.slug.trim()) {
      assertExplicitSlug(args.slug, "Category slug");
    }
    const slug = normalizeSlug(args.slug || args.name);

    if (!slug) {
      throw new Error("Slug is required");
    }

    if (slug === UNCATEGORIZED_SLUG) {
      throw new Error("Reserved category slug");
    }

    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (existing) {
      throw new Error("Category slug already exists");
    }

    const fieldDefinitions = sanitizeFieldDefinitions(args.fieldDefinitions);
    const timestamp = nowIso();
    const categoryId = await ctx.db.insert("categories", {
      slug,
      name: sanitizeRequiredText(args.name, "Category name", INPUT_LIMITS.categoryName),
      description: sanitizeRequiredText(
        args.description,
        "Category description",
        INPUT_LIMITS.categoryDescription
      ),
      icon: sanitizeRequiredText(args.icon, "Category icon", INPUT_LIMITS.icon),
      fieldDefinitions,
      createdBy: admin._id as any,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return { categoryId, slug };
  },
});

export const update = mutation({
  args: {
    currentSlug: v.string(),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    icon: v.string(),
    fieldDefinitions: v.array(metadataFieldDefinitionValidator),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    assertExplicitSlug(args.currentSlug, "Category slug");
    if (args.slug.trim()) {
      assertExplicitSlug(args.slug, "Category slug");
    }
    const currentSlug = normalizeSlug(args.currentSlug);
    const nextSlug = normalizeSlug(args.slug || args.name);

    if (!currentSlug || !nextSlug) {
      throw new Error("Slug is required");
    }

    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", currentSlug))
      .unique();

    if (!category) {
      throw new Error("Category not found");
    }

    if (currentSlug === UNCATEGORIZED_SLUG && nextSlug !== UNCATEGORIZED_SLUG) {
      throw new Error("Reserved category slug");
    }

    if (nextSlug === UNCATEGORIZED_SLUG && currentSlug !== UNCATEGORIZED_SLUG) {
      throw new Error("Reserved category slug");
    }

    if (nextSlug !== currentSlug) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", nextSlug))
        .unique();

      if (existing) {
        throw new Error("Category slug already exists");
      }
    }

    const fieldDefinitions = sanitizeFieldDefinitions(args.fieldDefinitions);
    const timestamp = nowIso();
    await ctx.db.patch(category._id, {
      name: sanitizeRequiredText(args.name, "Category name", INPUT_LIMITS.categoryName),
      slug: nextSlug,
      description: sanitizeRequiredText(
        args.description,
        "Category description",
        INPUT_LIMITS.categoryDescription
      ),
      icon: sanitizeRequiredText(args.icon, "Category icon", INPUT_LIMITS.icon),
      fieldDefinitions,
      updatedAt: timestamp,
    });

    if (nextSlug !== currentSlug) {
      const nodes = await ctx.db
        .query("nodes")
        .withIndex("by_category", (q) => q.eq("categorySlug", currentSlug))
        .collect();

      for (const node of nodes) {
        await ctx.db.patch(node._id, {
          categorySlug: nextSlug,
          updatedAt: timestamp,
        });
      }

      const reviews = await ctx.db.query("reviews").collect();
      for (const review of reviews) {
        if (review.selectedCategorySlug === currentSlug) {
          await ctx.db.patch(review._id, {
            selectedCategorySlug: nextSlug,
            updatedAt: timestamp,
          });
        }
      }
    }

    return { slug: nextSlug };
  },
});

export const remove = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const slug = normalizeSlug(args.slug);

    if (!slug) {
      throw new Error("Slug is required");
    }

    if (slug === UNCATEGORIZED_SLUG) {
      throw new Error("Cannot delete uncategorized");
    }

    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (!category) {
      throw new Error("Category not found");
    }

    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_category", (q) => q.eq("categorySlug", category.slug))
      .collect();

    let redirectSlug: string | null = null;
    if (nodes.length) {
      const uncategorized = await ensureUncategorizedCategory(ctx, admin._id as any);
      const timestamp = nowIso();

      for (const node of nodes) {
        await ctx.db.patch(node._id, {
          categorySlug: uncategorized.slug,
          updatedAt: timestamp,
        });
      }

      redirectSlug = uncategorized.slug;
    }

    await ctx.db.delete(category._id);

    return {
      movedNodeCount: nodes.length,
      redirectSlug,
    };
  },
});
