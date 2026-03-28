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
