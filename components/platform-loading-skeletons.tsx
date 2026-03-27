import { Skeleton } from "@/components/ui/skeleton";

const DUMMY_ACTION_WIDTHS = ["w-28", "w-24", "w-20"];

type HeaderProps = {
  showActions?: number;
  showEyebrow?: boolean;
  titleWidth?: string;
};

function getActionWidth(index: number) {
  return DUMMY_ACTION_WIDTHS[index % DUMMY_ACTION_WIDTHS.length];
}

export function CompactHeaderSkeleton({
  showActions = 0,
  showEyebrow = true,
  titleWidth = "w-2/5",
}: HeaderProps) {
  return (
    <div className="mb-10">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0 flex-1">
          {showEyebrow ? <Skeleton className="h-3 w-28 mb-3" /> : null}
          <Skeleton className={`h-12 ${titleWidth} max-w-xl`} />
          <Skeleton className="mt-4 h-4 w-2/5 max-w-2xl" />
        </div>
        {showActions > 0 ? (
          <div className="flex gap-4">
            {Array.from({ length: showActions }).map((_, index) => (
              <Skeleton key={`header-action-${index}`} className={`h-9 ${getActionWidth(index)}`} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function ReviewPosterSkeleton() {
  return (
    <div className="group space-y-4">
      <div className="aspect-[2/3] bg-surface-low border border-white/5 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <Skeleton className="h-full w-full" />
      </div>
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}

export function ReviewPosterGridSkeleton({
  count = 12,
  className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
  gap = "gap-6",
}: {
  count?: number;
  className?: string;
  gap?: string;
}) {
  return (
    <section className={`${className} ${gap}`}>
      {Array.from({ length: count }).map((_, index) => (
        <ReviewPosterSkeleton key={`poster-${index}`} />
      ))}
    </section>
  );
}

export function ReviewListSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          className="border-b border-white/5 pb-6 last:border-0 last:pb-0"
          key={`review-item-${index}`}
        >
          <div className="space-y-3">
            <Skeleton className="h-6 w-11/12" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NodeReviewLayoutSkeleton() {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="bg-surface-low border border-white/5 p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <ReviewListSkeleton rows={5} />
      </div>
      <div className="space-y-6">
        <div className="bg-surface-low p-6 border border-white/5">
          <div className="space-y-6">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
        <div className="bg-surface-low p-6 border border-white/5">
          <div className="space-y-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ReviewDetailSkeleton() {
  return (
    <article className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
        <div className="flex-1 max-w-4xl space-y-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-11 w-5/6 max-w-3xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
        <div className="shrink-0 flex flex-col items-start md:items-end gap-3">
          <div className="flex flex-wrap justify-end gap-3">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-20" />
          </div>
        </div>
      </div>
    </article>
  );
}

export function WritePageSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px] items-start">
      <section className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full md:col-span-2" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-5 md:grid-cols-[160px_1fr] items-end">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-4 w-40" />
        </div>
      </section>
      <aside className="sticky top-10 space-y-6">
        <div className="bg-surface-lowest p-6 border border-white/5">
          <Skeleton className="h-3 w-24 mb-4" />
          <Skeleton className="h-10 w-5/6" />
          <Skeleton className="h-4 w-32 mt-6" />
          <Skeleton className="h-24 mt-3 w-full" />
        </div>
      </aside>
    </div>
  );
}

export function AdminReviewListSkeleton({ rows = 6 }) {
  return (
    <section className="space-y-4">
      <div className="bg-surface-low border border-white/5 p-4 space-y-3">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-44 w-full" />
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton className="h-10 w-full" key={`admin-row-${index}`} />
        ))}
      </div>
    </section>
  );
}

export function AdminEntityFormSkeleton() {
  return (
    <div className="bg-surface-low p-10 border-l-2 border-primary/50 space-y-6">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-10 w-24" />
    </div>
  );
}
