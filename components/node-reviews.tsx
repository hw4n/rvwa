"use client";

import * as React from "react";
import Link from "next/link";
import type { Review } from "@/lib/domain";
import { ReviewItemTitle } from "@/components/review-item-title";
import { ReviewRatingDisplay } from "@/components/review-rating-display";
import { getReviewExplicitTitle } from "@/lib/review-display";
import { getReviewDisplayTitle } from "@/lib/review-display";
import { ReviewSpoilerGate } from "@/components/review-spoiler-gate";

const PAGE_SIZE = 5;

export function NodeReviews({
  reviews,
}: {
  reviews: Review[];
}) {
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMore = reviews.length > visibleCount;

  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [reviews]);

  React.useEffect(() => {
    if (!loadMoreRef.current || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((current) => Math.min(current + PAGE_SIZE, reviews.length));
        }
      },
      {
        rootMargin: "160px 0px",
      }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, reviews.length]);

  function getReviewPreview(review: Review) {
    const explicitTitle = getReviewExplicitTitle(review);
    if (explicitTitle) {
      return explicitTitle;
    }

    const compactBody = review.body.trim().replace(/\n+/g, " ");
    if (!compactBody) {
      return "내용이 비어 있습니다.";
    }

    return `${compactBody.slice(0, 190)}${compactBody.length > 190 ? "…" : ""}`;
  }

  return (
    <div className="space-y-8">
      {reviews.length ? null : (
        <div className="text-center border border-border bg-surface-low p-10">
          <p className="text-[10px] font-black uppercase text-foreground/20 tracking-[0.4em]">
            작성된 리뷰가 아직 없습니다.
          </p>
        </div>
      )}
      {visibleReviews.map((review) => {
        const previewText = getReviewPreview(review);
        const reviewBody = (
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground font-medium line-clamp-3">
            {previewText}
          </p>
        );

        if (review.spoiler) {
          return (
            <article
              className="space-y-4 border border-[color:var(--spoiler-soft)] bg-[var(--spoiler-surface)] p-5"
              key={review.id}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
                <div className="min-w-0">
                  <div className="space-y-2">
                    <div className="text-foreground/40 text-[10px] font-black uppercase tracking-[0.2em] leading-none">
                      {new Date(review.updatedAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-xs font-black tracking-[0.2em] text-tertiary/90">
                      {review.author?.name ?? "익명"}
                    </div>
                  </div>
                  <ReviewItemTitle
                    className="mt-3"
                    spoiler
                    title={getReviewDisplayTitle(review)}
                    titleClassName="text-sm"
                  />
                  <div className="mt-3 inline-flex items-center gap-2 border border-[color:var(--spoiler-soft)] bg-[var(--spoiler-surface)] px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--spoiler)]">
                    <span>!</span>
                    <span>스포일러 리뷰</span>
                  </div>
                  <ReviewSpoilerGate
                    className="mt-2"
                    confirmLabel="요약 확인"
                    description="이 리뷰 요약에는 스포일러가 포함되어 있습니다."
                    title="스포일러"
                    variant="compact"
                  >
                    {reviewBody}
                  </ReviewSpoilerGate>
                </div>
                <ReviewRatingDisplay rating={review.rating} size="compact" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-block border border-[color:var(--spoiler-soft)] bg-[var(--spoiler-surface)] px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--spoiler)]">
                  열기 전 주의
                </span>
                <Link
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-[color:color-mix(in_srgb,var(--spoiler)_72%,transparent)] transition-colors hover:text-[var(--spoiler)]"
                  href={`/r/${review.id}`}
                >
                  상세 보기
                </Link>
              </div>
            </article>
          );
        }

        return (
        <Link
          href={`/r/${review.id}`}
          key={review.id}
          className="block group border-b border-border pb-8 last:border-0 last:pb-0"
        >
          <article className="space-y-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
              <div className="min-w-0">
                <div className="space-y-2">
                  <div className="text-foreground/40 text-[10px] font-black uppercase tracking-[0.2em] leading-none">
                    {new Date(review.updatedAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                <div className="text-xs font-black tracking-[0.2em] text-tertiary/90">
                  {review.author?.name ?? "익명"}
                </div>
                </div>
                {getReviewExplicitTitle(review) ? (
                  <ReviewItemTitle
                    className="mt-3"
                    title={getReviewDisplayTitle(review)}
                    titleClassName="text-sm"
                  />
                ) : null}
                {reviewBody}
              </div>
              <ReviewRatingDisplay rating={review.rating} size="compact" />
            </div>
          </article>
        </Link>
        );
      })}
      {hasMore ? <div className="h-4" ref={loadMoreRef} /> : null}
    </div>
  );
}
