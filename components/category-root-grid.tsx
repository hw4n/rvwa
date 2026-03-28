"use client";

import Image from "next/image";
import Link from "next/link";
import { usePaginatedQuery } from "convex/react";
import { PosterRatingBadge } from "@/components/poster-rating-badge";
import { Button } from "@/components/ui/button";
import { getPosterImageUrl } from "@/lib/poster";

const PAGE_SIZE = 24;

export function CategoryRootGrid({
  categorySlug,
}: {
  categorySlug: string;
}) {
  const { results, status, isLoading, loadMore } = usePaginatedQuery(
    "categories:listRootsPage" as any,
    { slug: categorySlug },
    { initialNumItems: PAGE_SIZE }
  );

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-6">
        {results.map((node) => (
          <Link
            className="group space-y-4"
            href={`/n/${node.slug}`}
            key={node.id}
          >
            <div className="relative flex aspect-[2/3] flex-col items-center justify-center overflow-hidden border border-white/5 bg-surface-low p-6 transition-all group-hover:scale-[1.02] group-hover:border-primary/30">
              {node.coverImage ? (
                <Image
                  alt={node.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                  src={getPosterImageUrl(node.coverImage, "card") ?? ""}
                />
              ) : null}
              <PosterRatingBadge rating={node.rating} />
              <div className="absolute inset-0 bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
              {!node.coverImage ? (
                <span className="mb-4 select-none text-6xl font-black uppercase tracking-tighter text-white/5 transition-transform group-hover:scale-110">
                  {node.title.charAt(0)}
                </span>
              ) : null}
              <div className="relative z-10 mt-auto flex flex-col items-center gap-1 opacity-40 transition-opacity group-hover:opacity-100">
                <div className="h-px w-6 bg-primary/20" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="line-clamp-1 text-center text-sm font-black tracking-tight text-white transition-colors group-hover:text-primary">
                {node.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>

      {!results.length && !isLoading ? (
        <div className="border border-white/5 bg-surface-low p-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
            표시할 상위 항목이 없습니다.
          </p>
        </div>
      ) : null}

      {status !== "Exhausted" ? (
        <div className="flex justify-center">
          <Button
            className="rounded-none border-white/10 hover:bg-white/5"
            disabled={status === "LoadingMore"}
            onClick={() => loadMore(PAGE_SIZE)}
            type="button"
            variant="outline"
          >
            {status === "LoadingMore" ? "불러오는 중" : "더 불러오기"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
