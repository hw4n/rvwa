/* eslint-disable @typescript-eslint/no-explicit-any */
import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { INPUT_LIMITS, getViewerDoc, requireViewer, sanitizeRequiredText, toUserSummary } from "./helpers";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerDoc(ctx);
    return viewer ? toUserSummary(viewer as any) : null;
  },
});

export const reviewLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 6), 100));
    const reviewCountByUserId = new Map<string, number>();

    const approvedReviews = ctx.db
      .query("reviews")
      .withIndex("by_status_and_updated_at", (q) => q.eq("status", "approved"))
      .order("desc");

    for await (const review of approvedReviews) {
      const authorId = String(review.authorId);
      reviewCountByUserId.set(authorId, (reviewCountByUserId.get(authorId) ?? 0) + 1);
    }

    const rankedAuthors = [...reviewCountByUserId.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit);

    const users = await Promise.all(rankedAuthors.map(([userId]) => ctx.db.get(userId as any)));

    return rankedAuthors.map(([userId, reviewCount], index) => {
      const user = users[index];
      const displayName = user?.name?.trim() || "이름 미설정";

      return {
        userId,
        rank: index + 1,
        displayName,
        reviewCount,
      };
    });
  },
});

export const updateDisplayName = mutation({
  args: {
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const displayName = sanitizeRequiredText(args.displayName, "Display name", INPUT_LIMITS.handle);

    await ctx.db.patch(viewer._id, {
      name: displayName,
    });

    return toUserSummary({
      ...(viewer as any),
      name: displayName,
    });
  },
});
