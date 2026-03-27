"use client";

import type { Review, ReviewDraft } from "@/lib/domain";

const REVIEWS_KEY = "rvwa.local-reviews";
const DRAFTS_KEY = "rvwa.review-drafts";

type DraftMap = Record<string, ReviewDraft>;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getLocalReviewById(reviewId: string) {
  return readJson<Review[]>(REVIEWS_KEY, []).find((review) => review.id === reviewId);
}

export function getLocalReviewsForNode(nodeId: string) {
  return readJson<Review[]>(REVIEWS_KEY, [])
    .filter((review) => review.nodeId === nodeId)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function saveLocalReview(review: Review) {
  const reviews = readJson<Review[]>(REVIEWS_KEY, []).filter(
    (entry) => entry.id !== review.id
  );
  writeJson(REVIEWS_KEY, [review, ...reviews]);
}

export function getDraft(nodeId: string): ReviewDraft | undefined {
  return readJson<DraftMap>(DRAFTS_KEY, {})[nodeId];
}

export function saveDraft(nodeId: string, draft: ReviewDraft) {
  const drafts = readJson<DraftMap>(DRAFTS_KEY, {});
  drafts[nodeId] = draft;
  writeJson(DRAFTS_KEY, drafts);
}

export function clearDraft(nodeId: string) {
  const drafts = readJson<DraftMap>(DRAFTS_KEY, {});
  delete drafts[nodeId];
  writeJson(DRAFTS_KEY, drafts);
}
