/* eslint-disable @typescript-eslint/no-explicit-any */
import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import {
  INPUT_LIMITS,
  assertExplicitSlug,
  assertNormalizedSlug,
  canReadReview,
  getViewerDoc,
  normalizeSlug,
  nowIso,
  requireAdmin,
  requireViewer,
  sanitizeOptionalText,
  sanitizeRequiredText,
  sanitizeAttributes,
  toReview,
} from "./helpers";
import { formatRatingInputValue, normalizeStoredRating, normalizeSubmittedRating } from "../lib/review-rating";

async function findDraftForNode(ctx: any, userId: string, nodeId: string) {
  const reviews = await ctx.db
    .query("reviews")
    .withIndex("by_author", (q: any) => q.eq("authorId", userId))
    .collect();

  return (
    reviews.find(
      (review: any) => review.nodeId === nodeId && review.status === "draft"
    ) ?? null
  );
}

async function ensureNodeExists(ctx: any, nodeId: string) {
  const node = await ctx.db.get(nodeId);
  if (!node) {
    throw new Error("Item not found");
  }
  return node;
}

function excerptFromBody(body: string, fallback: string) {
  const text = body
    .replace(/[`#>*_\-\[\]\(\)]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.slice(0, 180) || fallback;
}

async function ensureCategory(ctx: any, admin: any, args: { slug?: string; name: string }) {
  if (args.slug?.trim()) {
    assertExplicitSlug(args.slug, "Category slug");
  }
  const slug = normalizeSlug(args.slug || args.name);
  if (!slug) {
    throw new Error("Category is required");
  }

  const existing = await ctx.db
    .query("categories")
    .withIndex("by_slug", (q: any) => q.eq("slug", slug))
    .unique();

  if (existing) {
    return existing;
  }

  const timestamp = nowIso();
  const categoryId = await ctx.db.insert("categories", {
    slug,
    name: sanitizeRequiredText(args.name, "Category name", INPUT_LIMITS.categoryName),
    description: sanitizeRequiredText(args.name, "Category description", INPUT_LIMITS.categoryDescription),
    icon: "folder",
    fieldDefinitions: [],
    createdBy: admin._id as any,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return await ctx.db.get(categoryId);
}

async function getExistingCategory(ctx: any, slug?: string | null) {
  if (!slug) {
    return null;
  }

  return await ctx.db
    .query("categories")
    .withIndex("by_slug", (q: any) => q.eq("slug", slug))
    .unique();
}

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 4), 120));
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_status_and_updated_at", (q) => q.eq("status", "approved"))
      .order("desc")
      .take(limit);

    return await Promise.all(
      reviews.map((review) => toReview(ctx, review as any))
    );
  },
});

export const getDraft = query({
  args: { nodeId: v.id("nodes") },
  handler: async (ctx, args) => {
    const viewer = await getViewerDoc(ctx);
    if (!viewer) {
      return null;
    }

    const draft = await findDraftForNode(ctx, viewer._id, args.nodeId);
    if (!draft) {
      return null;
    }

    return {
      title: draft.title,
      body: draft.body,
      rating: formatRatingInputValue(draft.rating),
      spoiler: draft.spoiler,
    };
  },
});

export const getById = query({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      return null;
    }

    const viewer = await getViewerDoc(ctx);
    if (!canReadReview(viewer as any, review as any)) {
      return null;
    }

    return await toReview(ctx, review as any);
  },
});

export const upsertDraft = mutation({
  args: {
    nodeId: v.id("nodes"),
    title: v.optional(v.string()),
    body: v.string(),
    rating: v.optional(v.number()),
    spoiler: v.boolean(),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const timestamp = nowIso();
    const draft = await findDraftForNode(ctx, viewer._id, args.nodeId);
    const title = sanitizeOptionalText(args.title, "Review title", INPUT_LIMITS.reviewTitle);
    const body = sanitizeRequiredText(args.body, "Review body", INPUT_LIMITS.reviewBody);
    await ensureNodeExists(ctx, args.nodeId);

    if (draft) {
      await ctx.db.patch(draft._id, {
        title,
        body,
        rating: normalizeSubmittedRating(args.rating),
        spoiler: args.spoiler,
        updatedAt: timestamp,
      });
      return { reviewId: draft._id };
    }

    const reviewId = await ctx.db.insert("reviews", {
      nodeId: args.nodeId,
      authorId: viewer._id as any,
      title,
      body,
      rating: normalizeSubmittedRating(args.rating),
      spoiler: args.spoiler,
      status: "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return { reviewId };
  },
});

export const publish = mutation({
  args: {
    nodeId: v.id("nodes"),
    title: v.optional(v.string()),
    body: v.string(),
    rating: v.optional(v.number()),
    spoiler: v.boolean(),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const timestamp = nowIso();
    const existingDraft = await findDraftForNode(ctx, viewer._id, args.nodeId);
    const title = sanitizeOptionalText(args.title, "Review title", INPUT_LIMITS.reviewTitle);
    const body = sanitizeRequiredText(args.body, "Review body", INPUT_LIMITS.reviewBody);
    await ensureNodeExists(ctx, args.nodeId);

    if (existingDraft) {
      await ctx.db.patch(existingDraft._id, {
        title,
        body,
        rating: normalizeSubmittedRating(args.rating),
        spoiler: args.spoiler,
        status: "pending",
        updatedAt: timestamp,
        submittedAt: timestamp,
        approvedAt: undefined,
        approvedBy: undefined,
        rejectedAt: undefined,
        rejectedBy: undefined,
      });
      return { reviewId: existingDraft._id, status: "pending" };
    }

    const reviewId = await ctx.db.insert("reviews", {
      nodeId: args.nodeId,
      authorId: viewer._id as any,
      title,
      body,
      rating: normalizeSubmittedRating(args.rating),
      spoiler: args.spoiler,
      status: "pending",
      createdAt: timestamp,
      updatedAt: timestamp,
      submittedAt: timestamp,
    });

    return { reviewId, status: "pending" };
  },
});

export const discardDraft = mutation({
  args: { nodeId: v.id("nodes") },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const draft = await findDraftForNode(ctx, viewer._id, args.nodeId);

    if (draft) {
      await ctx.db.delete(draft._id);
    }
  },
});

export const submit = mutation({
  args: {
    nodeId: v.optional(v.id("nodes")),
    proposedTitle: v.optional(v.string()),
    selectedCategorySlug: v.optional(v.string()),
    suggestedCategoryName: v.optional(v.string()),
    title: v.optional(v.string()),
    body: v.string(),
    rating: v.optional(v.number()),
    spoiler: v.boolean(),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const proposedTitle = sanitizeOptionalText(args.proposedTitle, "Item title", INPUT_LIMITS.reviewTitle);
    const suggestedCategoryName = sanitizeOptionalText(
      args.suggestedCategoryName,
      "Category name",
      INPUT_LIMITS.suggestedCategoryName
    );
    const title = sanitizeOptionalText(args.title, "Review title", INPUT_LIMITS.reviewTitle);
    const body = sanitizeRequiredText(args.body, "Review body", INPUT_LIMITS.reviewBody);

    if (!args.nodeId && !proposedTitle) {
      throw new Error("Item title is required");
    }

    if (!args.nodeId && !args.selectedCategorySlug?.trim() && !suggestedCategoryName) {
      throw new Error("Category is required");
    }

    if (args.nodeId) {
      await ensureNodeExists(ctx, args.nodeId);
    }

    const timestamp = nowIso();
    const reviewId = await ctx.db.insert("reviews", {
      nodeId: args.nodeId,
      authorId: viewer._id as any,
      proposedTitle,
      selectedCategorySlug: args.selectedCategorySlug?.trim() || undefined,
      suggestedCategoryName,
      title,
      body,
      rating: normalizeSubmittedRating(args.rating),
      spoiler: args.spoiler,
      status: "pending",
      createdAt: timestamp,
      updatedAt: timestamp,
      submittedAt: timestamp,
    });

    return { reviewId };
  },
});

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerDoc(ctx);
    if (!viewer || viewer.role !== "admin") {
      return [];
    }

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return await Promise.all(
      reviews
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((review) => toReview(ctx, review as any))
    );
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerDoc(ctx);
    if (!viewer) {
      return [];
    }

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_author", (q) => q.eq("authorId", viewer._id))
      .collect();

    return await Promise.all(
      reviews
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((review) => toReview(ctx, review as any))
    );
  },
});

export const resolveAndApprove = mutation({
  args: {
    reviewId: v.id("reviews"),
    nodeId: v.optional(v.id("nodes")),
    categorySlug: v.optional(v.string()),
    newCategoryName: v.optional(v.string()),
    newCategorySlug: v.optional(v.string()),
    newItemTitle: v.optional(v.string()),
    newItemSummary: v.optional(v.string()),
    newItemSlug: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    attributes: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const review = await ctx.db.get(args.reviewId);

    if (!review) {
      throw new Error("Review not found");
    }

    const finalNodeId = args.nodeId ?? review.nodeId ?? undefined;
    if (finalNodeId) {
      await ensureNodeExists(ctx, finalNodeId);
    }

    let resolvedNodeId = finalNodeId;

    if (!resolvedNodeId) {
      let category = await getExistingCategory(
        ctx,
        args.categorySlug?.trim() || review.selectedCategorySlug
      );

      if (!category) {
        const categoryName = args.newCategoryName?.trim() || review.suggestedCategoryName?.trim();
        if (!categoryName) {
          throw new Error("Category is required");
        }

        category = await ensureCategory(ctx, admin, {
          name: categoryName,
          slug: args.newCategorySlug?.trim(),
        });
      }

      const rawItemTitle =
        sanitizeOptionalText(args.newItemTitle, "Item title", INPUT_LIMITS.nodeTitle) ||
        sanitizeOptionalText(review.proposedTitle, "Item title", INPUT_LIMITS.nodeTitle) ||
        sanitizeOptionalText(review.title, "Review title", INPUT_LIMITS.nodeTitle) ||
        excerptFromBody(review.body, "item");
      if (!rawItemTitle) {
        throw new Error("Item title is required");
      }
      const itemTitle = sanitizeRequiredText(rawItemTitle, "Item title", INPUT_LIMITS.nodeTitle);

      const itemSlug = assertNormalizedSlug(args.newItemSlug || itemTitle, "Item slug");

      const existingNode = await ctx.db
        .query("nodes")
        .withIndex("by_slug", (q: any) => q.eq("slug", itemSlug))
        .unique();

      if (existingNode) {
        throw new Error("Item slug already exists");
      }

      const timestamp = nowIso();
      resolvedNodeId = await ctx.db.insert("nodes", {
        slug: itemSlug,
        title: itemTitle,
        categorySlug: category.slug,
        parentId: undefined,
        summary: sanitizeRequiredText(
          sanitizeOptionalText(args.newItemSummary, "Item summary", INPUT_LIMITS.nodeSummary) ||
            excerptFromBody(review.body, itemTitle),
          "Item summary",
          INPUT_LIMITS.nodeSummary
        ),
        status: undefined,
        coverImage: sanitizeOptionalText(args.coverImage, "Cover image URL", 500),
        attributes: sanitizeAttributes(args.attributes ?? {}, category.fieldDefinitions ?? []),
        externalRefs: [],
        tagSlugs: [],
        createdBy: admin._id as any,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    const timestamp = nowIso();
    await ctx.db.patch(args.reviewId, {
      nodeId: resolvedNodeId,
      status: "approved",
      updatedAt: timestamp,
      approvedAt: timestamp,
      approvedBy: admin._id as any,
      rejectedAt: undefined,
      rejectedBy: undefined,
    });

    return { reviewId: args.reviewId, nodeId: resolvedNodeId };
  },
});

export const reject = mutation({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const review = await ctx.db.get(args.reviewId);

    if (!review) {
      throw new Error("Review not found");
    }

    const timestamp = nowIso();
    await ctx.db.patch(args.reviewId, {
      status: "rejected",
      updatedAt: timestamp,
      rejectedAt: timestamp,
      rejectedBy: admin._id as any,
      approvedAt: undefined,
      approvedBy: undefined,
    });
  },
});

export const updateSubmission = mutation({
  args: {
    reviewId: v.id("reviews"),
    nodeId: v.optional(v.id("nodes")),
    proposedTitle: v.optional(v.string()),
    selectedCategorySlug: v.optional(v.string()),
    suggestedCategoryName: v.optional(v.string()),
    title: v.optional(v.string()),
    body: v.string(),
    rating: v.optional(v.number()),
    spoiler: v.boolean(),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const review = await ctx.db.get(args.reviewId);

    if (!review) {
      throw new Error("Review not found");
    }

    if (review.authorId !== viewer._id) {
      throw new Error("Unauthorized");
    }

    const proposedTitle = sanitizeOptionalText(args.proposedTitle, "Item title", INPUT_LIMITS.reviewTitle);
    const suggestedCategoryName = sanitizeOptionalText(
      args.suggestedCategoryName,
      "Category name",
      INPUT_LIMITS.suggestedCategoryName
    );
    const title = sanitizeOptionalText(args.title, "Review title", INPUT_LIMITS.reviewTitle);
    const body = sanitizeRequiredText(args.body, "Review body", INPUT_LIMITS.reviewBody);

    if (!args.nodeId && !proposedTitle) {
      throw new Error("Item title is required");
    }

    if (!args.nodeId && !args.selectedCategorySlug?.trim() && !suggestedCategoryName) {
      throw new Error("Category is required");
    }

    if (args.nodeId) {
      await ensureNodeExists(ctx, args.nodeId);
    }

    const timestamp = nowIso();
    const nextStatus = viewer.role === "admin" ? "approved" : "pending";
    await ctx.db.patch(args.reviewId, {
      nodeId: args.nodeId,
      proposedTitle,
      selectedCategorySlug: args.selectedCategorySlug?.trim() || undefined,
      suggestedCategoryName,
      title,
      body,
      rating: normalizeSubmittedRating(args.rating),
      spoiler: args.spoiler,
      status: nextStatus,
      updatedAt: timestamp,
      submittedAt: nextStatus === "pending" ? timestamp : review.submittedAt,
      approvedAt: nextStatus === "approved" ? timestamp : undefined,
      approvedBy: nextStatus === "approved" ? (viewer._id as any) : undefined,
      rejectedAt: undefined,
      rejectedBy: undefined,
    });

    return { reviewId: args.reviewId };
  },
});

export const migrateRatingsToFivePointScale = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const reviews = await ctx.db.query("reviews").collect();
    let updated = 0;

    for (const review of reviews) {
      if (typeof review.rating !== "number" || !Number.isFinite(review.rating)) {
        continue;
      }

      const normalized = normalizeStoredRating(review.rating);
      if (normalized == null || normalized === review.rating) {
        continue;
      }

      await ctx.db.patch(review._id, { rating: normalized });
      updated += 1;
    }

    return { scanned: reviews.length, updated };
  },
});

export const deleteOwn = mutation({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const review = await ctx.db.get(args.reviewId);

    if (!review) {
      throw new Error("Review not found");
    }

    if (review.authorId !== viewer._id && viewer.role !== "admin") {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.reviewId);
    return { reviewId: args.reviewId };
  },
});
