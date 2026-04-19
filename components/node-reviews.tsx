/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { toast } from "sonner";
import type { Review, ReviewEngagement, ReviewVoteValue } from "@/lib/domain";
import { ReviewItemTitle } from "@/components/review-item-title";
import { ReviewRatingDisplay } from "@/components/review-rating-display";
import { getReviewExplicitTitle } from "@/lib/review-display";
import { cn } from "@/lib/utils";

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

function formatCommentCount(count: number) {
  return `댓글 ${count.toLocaleString("ko-KR")}개`;
}

function NodeReviewItem({ review }: { review: Review }) {
  const engagement = useQuery("reviews:getEngagement" as any, {
    reviewId: review.id,
  }) as ReviewEngagement | null | undefined;
  const castVote = useMutation("reviews:castVote" as any);
  const [pendingVote, setPendingVote] = React.useState<ReviewVoteValue | null>(null);
  const recommendCount = engagement?.recommendCount ?? review.recommendCount;
  const notRecommendCount = engagement?.notRecommendCount ?? review.notRecommendCount;
  const commentCount = engagement?.commentCount ?? review.commentCount;
  const viewerVote = engagement?.viewerVote ?? null;
  const voteScore = recommendCount - notRecommendCount;

  async function handleVote(value: ReviewVoteValue) {
    if (!engagement || pendingVote) {
      return;
    }

    if (!engagement.canVote) {
      toast.error("로그인한 사용자만 추천/비추천할 수 있습니다.");
      return;
    }

    setPendingVote(value);
    try {
      const result = await castVote({ reviewId: review.id, value });
      if (result?.action === "removed") {
        toast.success(value === "recommend" ? "추천을 취소했습니다." : "비추천을 취소했습니다.");
      } else if (result?.action === "switched") {
        toast.success(value === "recommend" ? "추천으로 변경했습니다." : "비추천으로 변경했습니다.");
      } else {
        toast.success(value === "recommend" ? "추천을 남겼습니다." : "비추천을 남겼습니다.");
      }
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "투표에 실패했습니다.");
    } finally {
      setPendingVote(null);
    }
  }

  const voteRail = (
    <div className="flex w-8 shrink-0 flex-col items-center gap-1 pt-1 sm:w-10">
      <button
        aria-pressed={viewerVote === "recommend"}
        className={cn(
          "flex size-7 items-center justify-center border border-transparent text-muted-foreground transition-colors sm:size-8",
          viewerVote === "recommend" && "text-primary",
          viewerVote !== "recommend" && "hover:border-border hover:text-foreground",
          !engagement?.canVote && viewerVote !== "recommend" && "opacity-60"
        )}
        onClick={() => void handleVote("recommend")}
        type="button"
      >
        <ChevronUp className="size-4" />
      </button>
      <span className="text-[10px] font-black tracking-[0.12em] text-foreground/80 sm:text-xs">
        {voteScore.toLocaleString("ko-KR")}
      </span>
      <button
        aria-pressed={viewerVote === "not_recommend"}
        className={cn(
          "flex size-7 items-center justify-center border border-transparent text-muted-foreground transition-colors sm:size-8",
          viewerVote === "not_recommend" && "text-primary",
          viewerVote !== "not_recommend" && "hover:border-border hover:text-foreground",
          !engagement?.canVote && viewerVote !== "not_recommend" && "opacity-60"
        )}
        onClick={() => void handleVote("not_recommend")}
        type="button"
      >
        <ChevronDown className="size-4" />
      </button>
    </div>
  );

  const ratingMeta = (
    <div className="justify-self-end text-right">
      <ReviewRatingDisplay rating={review.rating} size="compact" />
      <div className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-foreground/40 text-right sm:text-[11px]">
        {formatCommentCount(commentCount)}
      </div>
    </div>
  );

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
        <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-4 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
          {voteRail}
          <div className="min-w-0">
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
                {ratingMeta}
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
        </div>
      </div>
    );
  }

  return (
    <div
      key={review.id}
      className="border-b border-border pb-8 last:border-0 last:pb-0"
    >
      <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-4 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
        {voteRail}
        <div className="min-w-0">
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
                {ratingMeta}
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
      </div>
    </div>
  );
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
      {visibleReviews.map((review) => (
        <NodeReviewItem key={review.id} review={review} />
      ))}
      {hasMore ? <div className="h-4" ref={loadMoreRef} /> : null}
    </div>
  );
}
