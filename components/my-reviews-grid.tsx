"use client";

import * as React from "react";
import {
  useConvexAuth,
  usePaginatedQuery,
  type PaginatedQueryReference,
} from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { PosterRatingBadge } from "@/components/poster-rating-badge";
import { ReviewPosterGridSkeleton } from "@/components/platform-loading-skeletons";
import { ReviewItemTitle } from "@/components/review-item-title";
import type { Review } from "@/lib/domain";
import { getPosterImageUrl } from "@/lib/poster";
import { getReviewDisplayTitle } from "@/lib/review-display";

const PAGE_SIZE = 12;
const listMinePage = "reviews:listMinePage" as unknown as PaginatedQueryReference;

export function MyReviewsGrid() {
  const { isLoading: isAuthLoading } = useConvexAuth();
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const {
    results,
    status,
    isLoading,
    loadMore,
  } = usePaginatedQuery(
    listMinePage,
    isAuthLoading ? "skip" : {},
    { initialNumItems: PAGE_SIZE }
  ) as {
    results: Review[];
    status: "CanLoadMore" | "Exhausted" | "LoadingFirstPage" | "LoadingMore";
    isLoading: boolean;
    loadMore: (numItems: number) => void;
  };

  React.useEffect(() => {
    if (!loadMoreRef.current || status !== "CanLoadMore") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore(PAGE_SIZE);
        }
      },
      {
        rootMargin: "240px 0px",
      }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadMore, status]);

  if (isAuthLoading || (isLoading && results.length === 0)) {
    return <ReviewPosterGridSkeleton count={10} />;
  }

  if (!isLoading && results.length === 0) {
    return (
      <div className="border border-border bg-surface-low p-10 text-center md:p-20">
        <p className="text-xs font-black uppercase tracking-[0.4em] text-foreground/20">
          작성한 리뷰가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 md:gap-8">
        {results.map((review) => (
          <Link
            className="group space-y-4"
            href={`/r/${review.id}`}
            key={review.id}
          >
            <div
              className={`relative flex aspect-[2/3] flex-col items-center justify-center overflow-hidden border bg-surface-low p-6 transition-all group-hover:scale-[1.02] ${
                review.spoiler
                  ? "border-[color:var(--spoiler-soft)] group-hover:border-[var(--spoiler)]/60"
                  : "border-border group-hover:border-primary/40"
              }`}
            >
              {review.coverImage ? (
                <Image
                  alt={getReviewDisplayTitle(review)}
                  className="absolute inset-0 h-full w-full object-cover"
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                  src={getPosterImageUrl(review.coverImage, "card") ?? ""}
                  unoptimized
                />
              ) : null}
              <div
                className={`absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 ${
                  review.spoiler ? "bg-[var(--spoiler-surface)]" : "bg-primary/5"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-lowest/90 via-surface-lowest/10 to-transparent" />
              <PosterRatingBadge rating={review.rating} />
              {!review.coverImage ? (
                <span className="mb-4 select-none text-7xl font-black uppercase tracking-tighter text-foreground/5 transition-transform group-hover:scale-110">
                  {(review.nodeTitle ?? review.proposedTitle ?? "R").charAt(0)}
                </span>
              ) : null}
            </div>

            <ReviewItemTitle
              align="center"
              spoiler={review.spoiler}
              title={getReviewDisplayTitle(review)}
              titleClassName={`line-clamp-2 text-sm transition-colors ${
                review.spoiler ? "group-hover:text-[var(--spoiler)]" : "group-hover:text-primary"
              }`}
            />
          </Link>
        ))}
      </div>

      {status !== "Exhausted" ? <div className="h-8" ref={loadMoreRef} /> : null}
      {status === "LoadingMore" ? (
        <div className="flex justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/25">
            더 불러오는 중
          </p>
        </div>
      ) : null}
    </section>
  );
}
