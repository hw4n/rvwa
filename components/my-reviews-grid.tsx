"use client";

import * as React from "react";
import {
  useConvexAuth,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { PosterRatingBadge } from "@/components/poster-rating-badge";
import { ReviewPosterGridSkeleton } from "@/components/platform-loading-skeletons";
import { ReviewItemTitle } from "@/components/review-item-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import type { Category, Review } from "@/lib/domain";
import { getPosterImageUrl } from "@/lib/poster";
import { getReviewDisplayTitle } from "@/lib/review-display";

const PAGE_SIZE = 12;
const EMPTY_CATEGORIES: Category[] = [];
const EMPTY_CATEGORY_SLUGS: string[] = [];

export function MyReviewsGrid() {
  const { isLoading: isAuthLoading } = useConvexAuth();
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const categories = useQuery(api.categories.list, {}) ?? EMPTY_CATEGORIES;
  const reviewedCategorySlugs = useQuery(api.reviews.listMineCategories, isAuthLoading ? "skip" : {}) ?? EMPTY_CATEGORY_SLUGS;
  const [activeTab, setActiveTab] = React.useState("all");
  const reviewedCategorySlugSet = React.useMemo(
    () => new Set(reviewedCategorySlugs),
    [reviewedCategorySlugs]
  );
  const availableCategories = React.useMemo(
    () => categories.filter((category) => reviewedCategorySlugSet.has(category.slug)),
    [categories, reviewedCategorySlugSet]
  );
  const {
    results,
    status,
    isLoading,
    loadMore,
  } = usePaginatedQuery(
    api.reviews.listMinePage,
    isAuthLoading ? "skip" : {},
    { initialNumItems: PAGE_SIZE }
  ) as {
    results: Review[];
    status: "CanLoadMore" | "Exhausted" | "LoadingFirstPage" | "LoadingMore";
    isLoading: boolean;
    loadMore: (numItems: number) => void;
  };

  React.useEffect(() => {
    if (activeTab !== "all" && !availableCategories.some((category) => category.slug === activeTab)) {
      setActiveTab("all");
    }
  }, [activeTab, availableCategories]);

  const filteredResults = React.useMemo(
    () => (activeTab === "all" ? results : results.filter((review) => review.categorySlug === activeTab)),
    [activeTab, results]
  );

  React.useEffect(() => {
    if (!loadMoreRef.current || status !== "CanLoadMore") {
      return;
    }

    if (activeTab !== "all" && filteredResults.length === 0) {
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
  }, [activeTab, filteredResults.length, loadMore, status]);

  React.useEffect(() => {
    if (activeTab === "all" || filteredResults.length > 0 || status !== "CanLoadMore") {
      return;
    }

    loadMore(PAGE_SIZE);
  }, [activeTab, filteredResults.length, loadMore, status]);

  const emptyMessage = activeTab === "all" ? "작성한 리뷰가 없습니다." : "이 카테고리의 리뷰가 없습니다.";

  if (isAuthLoading || (isLoading && results.length === 0)) {
    return <ReviewPosterGridSkeleton count={10} />;
  }

  if (!isLoading && status === "Exhausted" && filteredResults.length === 0) {
    return (
      <div className="border border-border bg-surface-low p-10 text-center md:p-20">
        <p className="text-xs font-black uppercase tracking-[0.4em] text-foreground/20">
          {emptyMessage}
        </p>
      </div>
    );
  }

  const grid = (
    <section className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 md:gap-8">
        {filteredResults.map((review) => (
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
              titleClassName={`line-clamp-2 transition-colors ${
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

  return (
    <section className="space-y-6">
      <Tabs onValueChange={setActiveTab} value={activeTab}>
        <TabsList aria-label="내 리뷰 카테고리 탭">
          <TabsTrigger value="all">전체</TabsTrigger>
          {availableCategories.map((category) => (
            <TabsTrigger key={category.id} value={category.slug}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeTab}>{grid}</TabsContent>
      </Tabs>
    </section>
  );
}
