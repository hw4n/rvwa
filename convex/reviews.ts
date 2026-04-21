/* eslint-disable @typescript-eslint/no-explicit-any */
import { mutationGeneric as mutation, paginationOptsValidator, queryGeneric as query } from "convex/server";
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
  toUserSummary,
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

const REVIEW_DISCUSSION_LIMIT = 200;

function clampDiscussionLimit(limit?: number) {
  return Math.max(1, Math.min(Math.floor(limit ?? REVIEW_DISCUSSION_LIMIT), REVIEW_DISCUSSION_LIMIT));
}

function getReviewRecommendCount(review: { recommendCount?: number | null }) {
  return Math.max(0, review.recommendCount ?? 0);
}

function getReviewNotRecommendCount(review: { notRecommendCount?: number | null }) {
  return Math.max(0, review.notRecommendCount ?? 0);
}

function getReviewCommentCount(review: { commentCount?: number | null }) {
  return Math.max(0, review.commentCount ?? 0);
}

async function getReadableReviewWithViewer(ctx: any, reviewId: string) {
  const review = await ctx.db.get(reviewId);
  if (!review) {
    return { review: null, viewer: null };
  }

  const viewer = await getViewerDoc(ctx);
  if (!canReadReview(viewer as any, review as any)) {
    return { review: null, viewer };
  }

  return { review, viewer };
}

async function ensureApprovedReview(ctx: any, reviewId: string) {
  const review = await ctx.db.get(reviewId);
  if (!review) {
    throw new Error("리뷰를 찾을 수 없습니다.");
  }

  if (review.status !== "approved") {
    throw new Error("승인된 리뷰에서만 사용할 수 있습니다.");
  }

  return review;
}

async function getReviewCategorySlug(
  ctx: any,
  review: { nodeId?: string | null; selectedCategorySlug?: string | null },
  nodeCategoryCache: Map<string, string | null>
) {
  if (review.nodeId) {
    if (nodeCategoryCache.has(review.nodeId)) {
      return nodeCategoryCache.get(review.nodeId) ?? null;
    }

    const node = await ctx.db.get(review.nodeId as any);
    const categorySlug = node?.categorySlug ?? null;
    nodeCategoryCache.set(review.nodeId, categorySlug);
    return categorySlug;
  }

  return review.selectedCategorySlug ?? null;
}

async function getExistingVote(ctx: any, reviewId: string, userId: string) {
  return await ctx.db
    .query("reviewVotes")
    .withIndex("by_review_id_and_user_id", (q: any) => q.eq("reviewId", reviewId).eq("userId", userId))
    .unique();
}

async function getCommentAuthors(ctx: any, comments: any[]) {
  const authorIds = Array.from(new Set(comments.map((comment) => comment.authorId)));
  const authorDocs = await Promise.all(authorIds.map((authorId) => ctx.db.get(authorId)));

  return new Map(
    authorIds
      .map((authorId, index) => [authorId, authorDocs[index]] as const)
      .filter((entry) => Boolean(entry[1]))
  );
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

export const listMine = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const viewer = await getViewerDoc(ctx);
    if (!viewer) {
      return [];
    }

    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 4), 120));
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_author_id_and_updated_at", (q) => q.eq("authorId", viewer._id))
      .order("desc")
      .take(limit);

    return await Promise.all(
      reviews.map((review) => toReview(ctx, review as any))
    );
  },
});

export const listMineCategories = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerDoc(ctx);
    if (!viewer) {
      return [];
    }

    const nodeCategoryCache = new Map<string, string | null>();
    const categorySlugs = new Set<string>();

    const reviews = ctx.db
      .query("reviews")
      .withIndex("by_author_id_and_updated_at", (q) => q.eq("authorId", viewer._id))
      .order("desc");

    for await (const review of reviews) {
      const categorySlug = await getReviewCategorySlug(ctx, review as any, nodeCategoryCache);
      if (categorySlug) {
        categorySlugs.add(categorySlug);
      }
    }

    return [...categorySlugs];
  },
});

export const listRecentPage = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("reviews")
      .withIndex("by_status_and_updated_at", (q) => q.eq("status", "approved"))
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...page,
      page: await Promise.all(
        page.page.map((review) => toReview(ctx, review as any))
      ),
    };
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

export const getByIdForShare = query({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      return null;
    }

    const viewer = await getViewerDoc(ctx);
    const isLinkReadable =
      review.status === "approved" ||
      review.status === "pending" ||
      review.status === "rejected";

    if (!isLinkReadable && !canReadReview(viewer as any, review as any)) {
      return null;
    }

    return await toReview(ctx, review as any);
  },
});

export const getEngagement = query({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    const { review, viewer } = await getReadableReviewWithViewer(ctx, args.reviewId);
    if (!review) {
      return null;
    }

    const viewerVote = viewer && review.status === "approved"
      ? await getExistingVote(ctx, args.reviewId, viewer._id)
      : null;

    return {
      recommendCount: getReviewRecommendCount(review),
      notRecommendCount: getReviewNotRecommendCount(review),
      commentCount: getReviewCommentCount(review),
      viewerVote: viewerVote?.value ?? null,
      canVote: Boolean(viewer && review.status === "approved"),
    };
  },
});

export const getDiscussion = query({
  args: {
    reviewId: v.id("reviews"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { review, viewer } = await getReadableReviewWithViewer(ctx, args.reviewId);
    if (!review) {
      return null;
    }

    const limit = clampDiscussionLimit(args.limit);
    const comments = review.status === "approved"
      ? await ctx.db
        .query("reviewComments")
        .withIndex("by_review_id_and_created_at", (q) => q.eq("reviewId", args.reviewId))
        .order("asc")
        .take(limit)
      : [];
    const authorById = await getCommentAuthors(ctx, comments as any[]);
    const viewerVote = viewer
      ? await getExistingVote(ctx, args.reviewId, viewer._id)
      : null;

    const repliesByParentId = new Map<string, any[]>();
    const topLevelComments: any[] = [];
    for (const comment of comments) {
      if (comment.parentCommentId) {
        const siblings = repliesByParentId.get(comment.parentCommentId) ?? [];
        siblings.push(comment);
        repliesByParentId.set(comment.parentCommentId, siblings);
        continue;
      }

      topLevelComments.push(comment);
    }

    const serializedComments = topLevelComments.map((comment) => {
      const author = authorById.get(comment.authorId);
      const replies = (repliesByParentId.get(comment._id) ?? []).map((reply) => {
        const replyAuthor = authorById.get(reply.authorId);
        return {
          id: reply._id,
          parentCommentId: reply.parentCommentId ?? undefined,
          body: reply.body,
          author: replyAuthor ? toUserSummary(replyAuthor as any) : null,
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt,
          replyCount: reply.replyCount,
          isMine: Boolean(viewer && reply.authorId === viewer._id),
          isReviewAuthor: reply.authorId === review.authorId,
          canReply: false,
          canEdit: Boolean(viewer && reply.authorId === viewer._id && reply.replyCount === 0),
          canDelete: Boolean(viewer && reply.authorId === viewer._id && reply.replyCount === 0),
          replies: [],
        };
      });

      return {
        id: comment._id,
        parentCommentId: comment.parentCommentId ?? undefined,
        body: comment.body,
        author: author ? toUserSummary(author as any) : null,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        replyCount: comment.replyCount,
        isMine: Boolean(viewer && comment.authorId === viewer._id),
        isReviewAuthor: comment.authorId === review.authorId,
        canReply: Boolean(viewer && review.status === "approved"),
        canEdit: Boolean(viewer && comment.authorId === viewer._id && comment.replyCount === 0),
        canDelete: Boolean(viewer && comment.authorId === viewer._id && comment.replyCount === 0),
        replies,
      };
    });

    return {
      recommendCount: getReviewRecommendCount(review),
      notRecommendCount: getReviewNotRecommendCount(review),
      commentCount: getReviewCommentCount(review),
      viewerVote: viewerVote?.value ?? null,
      canVote: Boolean(viewer && review.status === "approved"),
      canComment: Boolean(viewer && review.status === "approved"),
      comments: serializedComments,
      hasMore: getReviewCommentCount(review) > comments.length,
    };
  },
});

export const castVote = mutation({
  args: {
    reviewId: v.id("reviews"),
    value: v.union(v.literal("recommend"), v.literal("not_recommend")),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const review = await ensureApprovedReview(ctx, args.reviewId);
    const existingVote = await getExistingVote(ctx, args.reviewId, viewer._id);

    if (existingVote) {
      if (existingVote.value === args.value) {
        await ctx.db.delete(existingVote._id);

        await ctx.db.patch(args.reviewId, {
          recommendCount: args.value === "recommend"
            ? Math.max(0, getReviewRecommendCount(review) - 1)
            : getReviewRecommendCount(review),
          notRecommendCount: args.value === "not_recommend"
            ? Math.max(0, getReviewNotRecommendCount(review) - 1)
            : getReviewNotRecommendCount(review),
        });

        return {
          reviewId: args.reviewId,
          value: null,
          action: "removed",
        };
      }

      await ctx.db.patch(existingVote._id, {
        value: args.value,
      });

      await ctx.db.patch(args.reviewId, {
        recommendCount: args.value === "recommend"
          ? getReviewRecommendCount(review) + 1
          : Math.max(0, getReviewRecommendCount(review) - 1),
        notRecommendCount: args.value === "not_recommend"
          ? getReviewNotRecommendCount(review) + 1
          : Math.max(0, getReviewNotRecommendCount(review) - 1),
      });

      return {
        reviewId: args.reviewId,
        value: args.value,
        action: "switched",
      };
    }

    await ctx.db.insert("reviewVotes", {
      reviewId: args.reviewId,
      userId: viewer._id as any,
      value: args.value,
      createdAt: nowIso(),
    });

    await ctx.db.patch(args.reviewId, {
      recommendCount: args.value === "recommend"
        ? getReviewRecommendCount(review) + 1
        : getReviewRecommendCount(review),
      notRecommendCount: args.value === "not_recommend"
        ? getReviewNotRecommendCount(review) + 1
        : getReviewNotRecommendCount(review),
    });

    return {
      reviewId: args.reviewId,
      value: args.value,
      action: "created",
    };
  },
});

export const addComment = mutation({
  args: {
    reviewId: v.id("reviews"),
    body: v.string(),
    parentCommentId: v.optional(v.id("reviewComments")),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const review = await ensureApprovedReview(ctx, args.reviewId);
    const body = sanitizeRequiredText(args.body, "Comment", INPUT_LIMITS.commentBody);
    let parentComment = null;

    if (args.parentCommentId) {
      parentComment = await ctx.db.get(args.parentCommentId);
      if (!parentComment || parentComment.reviewId !== args.reviewId) {
        throw new Error("답글을 달 댓글을 찾을 수 없습니다.");
      }
      if (parentComment.parentCommentId) {
        throw new Error("대댓글은 한 단계까지만 작성할 수 있습니다.");
      }
    }

    const timestamp = nowIso();
    const commentId = await ctx.db.insert("reviewComments", {
      reviewId: args.reviewId,
      parentCommentId: args.parentCommentId,
      authorId: viewer._id as any,
      body,
      replyCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    if (parentComment) {
      await ctx.db.patch(parentComment._id, {
        replyCount: Math.max(0, (parentComment.replyCount ?? 0) + 1),
      });
    }

    await ctx.db.patch(args.reviewId, {
      commentCount: getReviewCommentCount(review) + 1,
    });

    return { commentId };
  },
});

export const updateComment = mutation({
  args: {
    commentId: v.id("reviewComments"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const comment = await ctx.db.get(args.commentId);

    if (!comment) {
      throw new Error("댓글을 찾을 수 없습니다.");
    }

    if (comment.authorId !== viewer._id) {
      throw new Error("본인 댓글만 수정할 수 있습니다.");
    }

    if ((comment.replyCount ?? 0) > 0) {
      throw new Error("답글이 있는 댓글은 수정할 수 없습니다.");
    }

    await ensureApprovedReview(ctx, comment.reviewId);
    await ctx.db.patch(args.commentId, {
      body: sanitizeRequiredText(args.body, "Comment", INPUT_LIMITS.commentBody),
      updatedAt: nowIso(),
    });

    return { commentId: args.commentId };
  },
});

export const deleteComment = mutation({
  args: {
    commentId: v.id("reviewComments"),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const comment = await ctx.db.get(args.commentId);

    if (!comment) {
      throw new Error("댓글을 찾을 수 없습니다.");
    }

    if (comment.authorId !== viewer._id) {
      throw new Error("본인 댓글만 삭제할 수 있습니다.");
    }

    if ((comment.replyCount ?? 0) > 0) {
      throw new Error("답글이 있는 댓글은 삭제할 수 없습니다.");
    }

    const review = await ensureApprovedReview(ctx, comment.reviewId);
    await ctx.db.delete(args.commentId);

    if (comment.parentCommentId) {
      const parentComment = await ctx.db.get(comment.parentCommentId);
      if (parentComment) {
        await ctx.db.patch(parentComment._id, {
          replyCount: Math.max(0, (parentComment.replyCount ?? 0) - 1),
        });
      }
    }

    await ctx.db.patch(comment.reviewId, {
      commentCount: Math.max(0, getReviewCommentCount(review) - 1),
    });

    return { commentId: args.commentId };
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
      recommendCount: 0,
      notRecommendCount: 0,
      commentCount: 0,
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
      recommendCount: 0,
      notRecommendCount: 0,
      commentCount: 0,
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
      recommendCount: 0,
      notRecommendCount: 0,
      commentCount: 0,
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

export const listModeration = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerDoc(ctx);
    if (!viewer || viewer.role !== "admin") {
      return [];
    }

    const [pendingReviews, rejectedReviews] = await Promise.all([
      ctx.db
        .query("reviews")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect(),
      ctx.db
        .query("reviews")
        .withIndex("by_status", (q) => q.eq("status", "rejected"))
        .collect(),
    ]);

    return await Promise.all(
      [...pendingReviews, ...rejectedReviews]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((review) => toReview(ctx, review as any))
    );
  },
});

export const listMinePage = query({
  args: {
    categorySlug: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerDoc(ctx);
    if (!viewer) {
      return {
        page: [],
        isDone: true,
        continueCursor: args.paginationOpts.cursor ?? "",
      };
    }

    const reviews = ctx.db
      .query("reviews")
      .withIndex("by_author_id_and_updated_at", (q) => q.eq("authorId", viewer._id))
      .order("desc");

    if (!args.categorySlug) {
      const page = await reviews.paginate(args.paginationOpts);

      return {
        ...page,
        page: await Promise.all(
          page.page.map((review) => toReview(ctx, review as any))
        ),
      };
    }

    const matchedReviews = [];
    const nodeCategoryCache = new Map<string, string | null>();
    let cursor = args.paginationOpts.cursor ?? null;
    let isDone = false;

    while (matchedReviews.length < args.paginationOpts.numItems && !isDone) {
      const nextPage = await reviews.paginate({
        cursor,
        numItems: args.paginationOpts.numItems - matchedReviews.length,
      });

      cursor = nextPage.continueCursor;
      isDone = nextPage.isDone;

      for (const review of nextPage.page) {
        const categorySlug = await getReviewCategorySlug(ctx, review as any, nodeCategoryCache);
        if (categorySlug === args.categorySlug) {
          matchedReviews.push(review);
        }
      }
    }

    return {
      page: await Promise.all(
        matchedReviews.map((review) => toReview(ctx, review as any))
      ),
      isDone,
      continueCursor: cursor ?? "",
    };
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
          sanitizeOptionalText(args.newItemSummary, "Item summary", INPUT_LIMITS.nodeSummary) || "-",
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

export const moveToPending = mutation({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const review = await ctx.db.get(args.reviewId);

    if (!review) {
      throw new Error("Review not found");
    }

    const timestamp = nowIso();
    await ctx.db.patch(args.reviewId, {
      status: "pending",
      updatedAt: timestamp,
      submittedAt: timestamp,
      approvedAt: undefined,
      approvedBy: undefined,
      rejectedAt: undefined,
      rejectedBy: undefined,
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
