"use client";

import * as React from "react";
import Link from "next/link";
import type { Review } from "@/lib/domain";
import { ReviewItemTitle } from "@/components/review-item-title";
import { ReviewRatingDisplay } from "@/components/review-rating-display";
import { getReviewExplicitTitle } from "@/lib/review-display";

const PAGE_SIZE = 5;
const TITLE_PREVIEW_LENGTH = 56;
const BODY_PREVIEW_LENGTH = 190;

function compactPreviewText(value: string) {
  return value.replace(/[#>*`_\-\[\]\(\)]/g, " ").replace(/\s+/g, " ").trim();
}

function truncatePreviewText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function getBodyPreview(review: Review) {
  const compactBody = compactPreviewText(review.body);

  if (!compactBody) {
    return "내용이 비어 있습니다.";
  }

  return truncatePreviewText(compactBody, BODY_PREVIEW_LENGTH);
}

function getTitlePreview(review: Review) {
  const explicitTitle = getReviewExplicitTitle(review);

  if (!explicitTitle) {
    return "";
  }

  return truncatePreviewText(explicitTitle, TITLE_PREVIEW_LENGTH);
}

function SpoilerSummaryPreview({
  previewText,
}: {
  previewText: string;
}) {
  const [revealed, setRevealed] = React.useState(false);

  if (revealed) {
    return (
      <div className="mt-3 space-y-2">
        <button
          className="inline-flex items-center border border-[color:var(--spoiler-soft)] px-3 py-1.5 text-left text-[10px] font-black leading-relaxed tracking-[0.08em] text-[var(--spoiler)] transition-colors hover:bg-[var(--spoiler-surface)] sm:text-[11px] sm:tracking-[0.12em]"
          onClick={() => setRevealed(false)}
          type="button"
        >
          스포일러가 담긴 내용 숨기기
        </button>
        <p className="text-xs font-medium leading-relaxed text-muted-foreground line-clamp-3 sm:text-sm">
          {previewText}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        className="inline-flex items-center border border-[color:var(--spoiler-soft)] px-3 py-1.5 text-left text-[10px] font-black leading-relaxed tracking-[0.08em] text-[var(--spoiler)] transition-colors hover:bg-[var(--spoiler-surface)] sm:text-[11px] sm:tracking-[0.12em]"
        onClick={() => setRevealed(true)}
        type="button"
      >
        스포일러가 담긴 내용 확인
      </button>
    </div>
  );
}

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
        const titlePreview = getTitlePreview(review);
        const bodyPreview = getBodyPreview(review);
        const reviewBody = (
          <p className="mt-0.5 text-xs font-medium leading-relaxed text-muted-foreground line-clamp-3 sm:text-sm">
            {bodyPreview}
          </p>
        );

        if (review.spoiler) {
          return (
            <div
              className="border-b border-border pb-8 last:border-0 last:pb-0"
              key={review.id}
            >
              <article className="space-y-4">
                <div className="grid gap-4 items-start sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <div className="space-y-2">
                    <div className="text-[9px] font-black uppercase leading-none tracking-[0.16em] text-foreground/40 sm:text-[10px] sm:tracking-[0.2em]">
                      {new Date(review.updatedAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-[11px] font-black tracking-[0.16em] text-tertiary/90 sm:text-xs sm:tracking-[0.2em]">
                      {review.author?.name ?? "익명"}
                    </div>
                  </div>
                  <SpoilerSummaryPreview previewText={bodyPreview} />
                </div>
                <div className="justify-self-start sm:justify-self-end">
                  <ReviewRatingDisplay rating={review.rating} size="compact" />
                </div>
              </div>
              <div className="flex justify-end">
                <Link
                  className="text-[9px] font-black uppercase tracking-[0.16em] text-[color:color-mix(in_srgb,var(--spoiler)_72%,transparent)] transition-colors hover:text-[var(--spoiler)] sm:text-[10px] sm:tracking-[0.2em]"
                  href={`/r/${review.id}`}
                >
                  상세 보기
                </Link>
              </div>
              </article>
            </div>
          );
        }

        return (
          <div
            key={review.id}
            className="border-b border-border pb-8 last:border-0 last:pb-0"
          >
            <Link
              href={`/r/${review.id}`}
              className="block group"
            >
            <article className="space-y-4">
              <div className="grid gap-4 items-start sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <div className="space-y-2">
                    <div className="text-[9px] font-black uppercase leading-none tracking-[0.16em] text-foreground/40 sm:text-[10px] sm:tracking-[0.2em]">
                      {new Date(review.updatedAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-[11px] font-black tracking-[0.16em] text-tertiary/90 sm:text-xs sm:tracking-[0.2em]">
                      {review.author?.name ?? "익명"}
                    </div>
                  </div>
                  {titlePreview ? (
                    <ReviewItemTitle
                      className="mt-3"
                      title={titlePreview}
                      titleClassName="line-clamp-1 text-[13px] sm:text-sm"
                    />
                  ) : null}
                  {reviewBody}
                </div>
                <div className="justify-self-start sm:justify-self-end">
                  <ReviewRatingDisplay rating={review.rating} size="compact" />
                </div>
              </div>
            </article>
            </Link>
            <div className="mt-4 flex justify-end">
              <Link
                className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary sm:text-[10px] sm:tracking-[0.2em]"
                href={`/r/${review.id}`}
              >
                상세 보기
              </Link>
            </div>
          </div>
        );
      })}
      {hasMore ? <div className="h-4" ref={loadMoreRef} /> : null}
    </div>
  );
}
