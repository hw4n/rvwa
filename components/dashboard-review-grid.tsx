"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { PosterRatingBadge } from "@/components/poster-rating-badge";
import { getPosterImageUrl } from "@/lib/poster";
import { getReviewDisplayTitle } from "@/lib/review-display";
import type { Review } from "@/lib/domain";

const PAGE_SIZE = 12;

export function DashboardReviewGrid() {
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const [limit, setLimit] = React.useState(PAGE_SIZE);
  const queriedReviews = useQuery("reviews:listRecent" as any, { limit }) as Review[] | undefined;
  const reviews = queriedReviews ?? [];
  const isLoading = queriedReviews === undefined;
  const hasMore = reviews.length >= limit;

  React.useEffect(() => {
    if (!loadMoreRef.current || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setLimit((current) => current + PAGE_SIZE);
        }
      },
      {
        rootMargin: "240px 0px",
      }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore]);

  if (!isLoading && reviews.length === 0) {
    return (
      <div className="border border-white/5 bg-surface-low p-10 text-center md:p-20">
        <p className="text-xs font-black uppercase tracking-[0.4em] text-white/20">
          승인된 리뷰가 아직 없습니다.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-8 lg:grid-cols-5 xl:grid-cols-6">
        {reviews.map((review) => (
          <Link
            key={review.id}
            href={`/r/${review.id}`}
            className="group space-y-4"
          >
            <div className="relative flex aspect-[2/3] flex-col items-center justify-center overflow-hidden border border-white/5 bg-surface-low p-6 transition-all group-hover:scale-[1.02] group-hover:border-primary/40">
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
              <div className="absolute inset-0 bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
              <PosterRatingBadge rating={review.rating} />
              {!review.coverImage ? (
                <span className="mb-4 select-none text-7xl font-black uppercase tracking-tighter text-white/5 transition-transform group-hover:scale-110">
                  {(review.nodeTitle ?? review.proposedTitle ?? "R").charAt(0)}
                </span>
              ) : null}
              <div className="relative z-10 mt-auto flex flex-col items-center gap-1 opacity-40 transition-opacity group-hover:opacity-100">
                <div className="h-px w-6 bg-primary/20" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="line-clamp-2 text-center text-sm font-black leading-tight tracking-tight text-white transition-colors group-hover:text-primary">
                {getReviewDisplayTitle(review)}
              </h3>
            </div>
          </Link>
        ))}
      </div>

      {hasMore ? <div className="h-8" ref={loadMoreRef} /> : null}
      {isLoading || hasMore ? (
        <div className="flex justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/25">
            더 불러오는 중
          </p>
        </div>
      ) : null}
    </section>
  );
}
