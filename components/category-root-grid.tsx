"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PosterRatingBadge } from "@/components/poster-rating-badge";
import { getPosterImageUrl } from "@/lib/poster";

const PAGE_SIZE = 24;

export function CategoryRootGrid({
  categorySlug,
}: {
  categorySlug: string;
}) {
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const { results, status, isLoading, loadMore } = usePaginatedQuery(
    api.categories.listRootsPage,
    { slug: categorySlug },
    { initialNumItems: PAGE_SIZE }
  );

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

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 md:gap-6">
        {results.map((node) => (
          <Link
            className="group space-y-4"
            href={`/n/${node.slug}`}
            key={node.id}
          >
            <div className="relative flex aspect-[2/3] flex-col items-center justify-center overflow-hidden border border-border bg-surface-low p-6 transition-all group-hover:scale-[1.02] group-hover:border-primary/30">
              {node.coverImage ? (
                <Image
                  alt={node.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                  src={getPosterImageUrl(node.coverImage, "card") ?? ""}
                  unoptimized
                />
              ) : null}
              <PosterRatingBadge rating={node.rating} />
              <div className="absolute inset-0 bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-lowest/90 via-surface-lowest/10 to-transparent" />
              {!node.coverImage ? (
                <span className="mb-4 select-none text-6xl font-black uppercase tracking-tighter text-foreground/5 transition-transform group-hover:scale-110">
                  {node.title.charAt(0)}
                </span>
              ) : null}
            </div>
            <div className="space-y-1">
              <h3 className="line-clamp-1 text-center text-sm font-black tracking-tight text-foreground transition-colors group-hover:text-primary">
                {node.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>

      {!results.length && !isLoading ? (
        <div className="border border-border bg-surface-low p-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/20">
            표시할 상위 항목이 없습니다.
          </p>
        </div>
      ) : null}

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
