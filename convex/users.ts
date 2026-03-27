/* eslint-disable @typescript-eslint/no-explicit-any */
import { queryGeneric as query } from "convex/server";
import { getViewerDoc, toUserSummary } from "./helpers";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerDoc(ctx);
    return viewer ? toUserSummary(viewer as any) : null;
  },
});
