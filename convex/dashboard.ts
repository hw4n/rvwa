/* eslint-disable @typescript-eslint/no-explicit-any */
import { queryGeneric as query } from "convex/server";
import { toReview } from "./helpers";

export const getSnapshot = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    const nodes = await ctx.db.query("nodes").collect();
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();

    const recentReviews = await Promise.all(
      reviews
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 4)
        .map((review) => toReview(ctx, review as any))
    );

    return {
      totalCategories: categories.length,
      totalNodes: nodes.length,
      totalReviews: reviews.length,
      recentReviews,
    };
  },
});
