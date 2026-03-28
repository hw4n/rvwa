import type { Review } from "@/lib/domain";

function compactText(value: string) {
  return value.replace(/[#>*`_\-\[\]\(\)]/g, " ").replace(/\s+/g, " ").trim();
}

export function getReviewDisplayTitle(
  review: Pick<Review, "title" | "body" | "nodeTitle" | "proposedTitle"> & { spoiler?: boolean }
) {
  if (review.spoiler) {
    return "스포일러 리뷰";
  }

  if (review.title?.trim()) {
    return review.title.trim();
  }

  const body = compactText(review.body);
  if (body) {
    return body.slice(0, 80);
  }

  return review.nodeTitle ?? review.proposedTitle ?? "리뷰";
}

export function getReviewExplicitTitle(review: Pick<Review, "title">) {
  return review.title?.trim() || "";
}
