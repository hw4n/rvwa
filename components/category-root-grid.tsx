"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PosterRatingBadge } from "@/components/poster-rating-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPosterImageUrl } from "@/lib/poster";

const PAGE_SIZE = 24;
const UNCATEGORIZED_STUDIO_LABEL = "미분류";
const UNCATEGORIZED_TIMELINE_LABEL = "미분류";

type CategoryGridNode = {
  id: string;
  slug: string;
  title: string;
  coverImage?: string | null;
  rating?: number | null;
  attributes: Record<string, unknown>;
};

type StudioGroup = {
  label: string;
  nodes: CategoryGridNode[];
};

type TimelineGroup = {
  label: string;
  nodes: CategoryGridNode[];
  startYear?: number;
  quarter?: number;
};

function getStudioLabels(node: CategoryGridNode) {
  const studioValue = node.attributes.studio;

  if (Array.isArray(studioValue)) {
    return Array.from(new Set(studioValue.map((entry) => String(entry).trim()).filter(Boolean)));
  }

  if (typeof studioValue === "string" || typeof studioValue === "number") {
    const label = String(studioValue).trim();
    return label ? [label] : [];
  }

  return [];
}

function buildStudioGroups(nodes: CategoryGridNode[]) {
  const groups = new Map<string, CategoryGridNode[]>();

  for (const node of nodes) {
    const labels = getStudioLabels(node);
    const groupLabels = labels.length ? labels : [UNCATEGORIZED_STUDIO_LABEL];

    for (const label of groupLabels) {
      const group = groups.get(label);
      if (group) {
        group.push(node);
        continue;
      }
      groups.set(label, [node]);
    }
  }

  return [...groups.entries()]
    .map(([label, groupNodes]) => ({ label, nodes: groupNodes }))
    .sort((left, right) => {
      if (left.label === UNCATEGORIZED_STUDIO_LABEL && right.label !== UNCATEGORIZED_STUDIO_LABEL) {
        return 1;
      }

      if (right.label === UNCATEGORIZED_STUDIO_LABEL && left.label !== UNCATEGORIZED_STUDIO_LABEL) {
        return -1;
      }

      if (right.nodes.length !== left.nodes.length) {
        return right.nodes.length - left.nodes.length;
      }
      return left.label.localeCompare(right.label, "ko");
    });
}

function parseTimelineGroupValue(rawValue: string) {
  const normalized = rawValue.trim();
  if (!normalized) {
    return null;
  }

  const yearMatch = normalized.match(/\d{4}/);
  if (!yearMatch) {
    return null;
  }

  const startYear = Number(yearMatch[0]);
  if (!Number.isFinite(startYear)) {
    return null;
  }

  const quarterMatch = normalized.match(/([1-4])\s*분기|q\s*([1-4])/i);
  const quarterText = quarterMatch?.[1] ?? quarterMatch?.[2];
  const quarter = quarterText ? Number(quarterText) : undefined;

  return {
    label: quarter ? `${startYear}년 ${quarter}분기` : `${startYear}년`,
    startYear,
    quarter,
  };
}

function getTimelineEntries(node: CategoryGridNode) {
  const rawValue = node.attributes["airing-quarter"];
  const values = Array.isArray(rawValue) ? rawValue : rawValue == null ? [] : [rawValue];
  const entries = new Map<string, { label: string; startYear?: number; quarter?: number }>();

  for (const value of values) {
    const parsed = parseTimelineGroupValue(String(value));
    if (!parsed) {
      continue;
    }
    entries.set(parsed.label, parsed);
  }

  return [...entries.values()];
}

function buildTimelineGroups(nodes: CategoryGridNode[]) {
  const groups = new Map<string, TimelineGroup>();

  for (const node of nodes) {
    const entries = getTimelineEntries(node);

    if (!entries.length) {
      const uncategorized = groups.get(UNCATEGORIZED_TIMELINE_LABEL);
      if (uncategorized) {
        uncategorized.nodes.push(node);
      } else {
        groups.set(UNCATEGORIZED_TIMELINE_LABEL, {
          label: UNCATEGORIZED_TIMELINE_LABEL,
          nodes: [node],
        });
      }
      continue;
    }

    for (const entry of entries) {
      const group = groups.get(entry.label);
      if (group) {
        group.nodes.push(node);
        continue;
      }

      groups.set(entry.label, {
        label: entry.label,
        nodes: [node],
        startYear: entry.startYear,
        quarter: entry.quarter,
      });
    }
  }

  return [...groups.values()].sort((left, right) => {
    if (left.label === UNCATEGORIZED_TIMELINE_LABEL && right.label !== UNCATEGORIZED_TIMELINE_LABEL) {
      return 1;
    }

    if (right.label === UNCATEGORIZED_TIMELINE_LABEL && left.label !== UNCATEGORIZED_TIMELINE_LABEL) {
      return -1;
    }

    if ((right.startYear ?? -1) !== (left.startYear ?? -1)) {
      return (right.startYear ?? -1) - (left.startYear ?? -1);
    }

    if ((right.quarter ?? 0) !== (left.quarter ?? 0)) {
      return (right.quarter ?? 0) - (left.quarter ?? 0);
    }

    if (right.nodes.length !== left.nodes.length) {
      return right.nodes.length - left.nodes.length;
    }

    return left.label.localeCompare(right.label, "ko");
  });
}

function CategoryPosterCard({
  node,
  className,
  posterClassName,
  titleClassName,
  sizes,
}: {
  node: CategoryGridNode;
  className: string;
  posterClassName: string;
  titleClassName: string;
  sizes: string;
}) {
  return (
    <Link className={className} href={`/n/${node.slug}`}>
      <div className={posterClassName}>
        {node.coverImage ? (
          <Image
            alt={node.title}
            className="absolute inset-0 h-full w-full object-cover"
            fill
            loading="lazy"
            sizes={sizes}
            src={getPosterImageUrl(node.coverImage, "card") ?? ""}
            unoptimized
          />
        ) : null}
        <PosterRatingBadge rating={node.rating ?? undefined} />
        <div className="absolute inset-0 bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-lowest/90 via-surface-lowest/10 to-transparent" />
        {!node.coverImage ? (
          <span className="mb-4 select-none text-6xl font-black uppercase tracking-tighter text-foreground/5 transition-transform group-hover:scale-110">
            {node.title.charAt(0)}
          </span>
        ) : null}
      </div>
      <div className="space-y-1">
        <h3 className={titleClassName}>{node.title}</h3>
      </div>
    </Link>
  );
}

function CategoryAllGrid({ nodes }: { nodes: CategoryGridNode[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 md:gap-6">
      {nodes.map((node) => (
        <CategoryPosterCard
          className="group space-y-4"
          key={node.id}
          node={node}
          posterClassName="relative flex aspect-[2/3] flex-col items-center justify-center overflow-hidden border border-border bg-surface-low p-6 transition-all group-hover:scale-[1.02] group-hover:border-primary/30"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          titleClassName="mx-auto line-clamp-2 break-keep text-center text-[clamp(0.72rem,2vw,0.875rem)] font-black leading-snug tracking-tight text-foreground transition-colors [word-break:keep-all] group-hover:text-primary sm:text-sm"
        />
      ))}
    </div>
  );
}

function CategoryStudioRows({ groups }: { groups: StudioGroup[] }) {
  return <CategoryHorizontalRows groups={groups} />;
}

function CategoryTimelineRows({ groups }: { groups: TimelineGroup[] }) {
  return <CategoryHorizontalRows groups={groups} />;
}

function CategoryHorizontalRows({
  groups,
}: {
  groups: Array<{ label: string; nodes: CategoryGridNode[] }>;
}) {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section className="space-y-3" key={group.label}>
          <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
            <h2 className="truncate text-lg font-black tracking-tight text-foreground sm:text-xl">{group.label}</h2>
            <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground/60">
              {group.nodes.length} 작품
            </span>
          </div>
          <div className="-mx-4 overflow-x-auto px-4 pb-2 custom-scrollbar">
            <div className="flex gap-4 sm:gap-5">
              {group.nodes.map((node) => (
                <CategoryPosterCard
                  className="group w-32 shrink-0 space-y-3 sm:w-36 lg:w-40"
                  key={`${group.label}-${node.id}`}
                  node={node}
                  posterClassName="relative flex aspect-[2/3] flex-col items-center justify-center overflow-hidden border border-border bg-surface-low p-4 transition-all group-hover:-translate-y-1 group-hover:border-primary/30"
                  sizes="(max-width: 640px) 40vw, 160px"
                  titleClassName="line-clamp-2 break-keep text-sm font-black leading-snug tracking-tight text-foreground transition-colors [word-break:keep-all] group-hover:text-primary"
                />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

export function CategoryRootGrid({
  categorySlug,
  hasStudioField = false,
  hasTimelineField = false,
}: {
  categorySlug: string;
  hasStudioField?: boolean;
  hasTimelineField?: boolean;
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

  const defaultTab = hasStudioField ? "studio" : hasTimelineField ? "timeline" : "all";
  const hasGroupedView = hasStudioField || hasTimelineField;

  return (
    <section className="space-y-6">
      {hasGroupedView ? (
        <Tabs defaultValue={defaultTab}>
          <TabsList aria-label="카테고리 보기 방식">
            {hasStudioField ? <TabsTrigger value="studio">제작사</TabsTrigger> : null}
            {hasTimelineField ? <TabsTrigger value="timeline">시기</TabsTrigger> : null}
            <TabsTrigger value="all">전체</TabsTrigger>
          </TabsList>
          {hasStudioField ? (
            <TabsContent value="studio">
              <CategoryStudioRows groups={buildStudioGroups(results)} />
            </TabsContent>
          ) : null}
          {hasTimelineField ? (
            <TabsContent value="timeline">
              <CategoryTimelineRows groups={buildTimelineGroups(results)} />
            </TabsContent>
          ) : null}
          <TabsContent value="all">
            <CategoryAllGrid nodes={results} />
          </TabsContent>
        </Tabs>
      ) : (
        <CategoryAllGrid nodes={results} />
      )}

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
