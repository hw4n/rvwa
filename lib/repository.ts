/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchQuery } from "convex/nextjs";
import type { Category, ContentNode, Review, ReviewDraft } from "@/lib/domain";
import { getViewerToken } from "@/lib/auth";

type DashboardSnapshot = {
  totalCategories: number;
  totalNodes: number;
  totalReviews: number;
  recentReviews: Review[];
};

function decodeRouteSegment(value: string | undefined) {
  if (!value) {
    return "";
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function publicQuery<T>(name: string, args: Record<string, unknown> = {}) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return null;
  }

  return (await fetchQuery(name as any, args as any)) as T;
}

async function authQuery<T>(name: string, args: Record<string, unknown> = {}) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return null;
  }

  const token = await getViewerToken();
  const options = token ? { token } : undefined;
  return (await fetchQuery(name as any, args as any, options as any)) as T;
}

export async function getCategories() {
  return (await publicQuery<Category[]>("categories:list")) ?? [];
}

export async function getCategoryBySlug(slug: string) {
  return (await publicQuery<Category | null>("categories:getBySlug", { slug: decodeRouteSegment(slug) })) ?? null;
}

export async function getCategoryView(slug: string) {
  return (
    (await publicQuery<{
      category: Category;
      nodes: ContentNode[];
      roots: ContentNode[];
      nodeCount: number;
      reviewCount: number;
      topTags: Array<{ slug: string; count: number }>;
    } | null>("categories:getView", { slug: decodeRouteSegment(slug) })) ?? null
  );
}

export async function getNodeView(slug: string) {
  return (
    (await authQuery<{
      node: ContentNode;
      category: Category | null;
      children: ContentNode[];
      trail: ContentNode[];
      reviews: Review[];
    } | null>("nodes:getView", { slug: decodeRouteSegment(slug) })) ?? null
  );
}

export async function getItemIndex() {
  return (await authQuery<ContentNode[]>("nodes:listIndex")) ?? [];
}

export async function getDashboardSnapshot() {
  return (
    (await publicQuery<DashboardSnapshot>("dashboard:getSnapshot")) ?? {
      totalCategories: 0,
      totalNodes: 0,
      totalReviews: 0,
      recentReviews: [],
    }
  );
}

export async function getRecentReviews(limit = 4) {
  return (await publicQuery<Review[]>("reviews:listRecent", { limit })) ?? [];
}

export async function getReviewDraft(nodeId: string) {
  return (await authQuery<ReviewDraft | null>("reviews:getDraft", { nodeId })) ?? null;
}

export async function getReviewById(reviewId: string) {
  return (await authQuery<Review | null>("reviews:getById", { reviewId })) ?? null;
}

export async function getPendingReviews() {
  return (await authQuery<Review[]>("reviews:listPending")) ?? [];
}
