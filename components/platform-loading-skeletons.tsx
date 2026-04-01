import { Skeleton } from "@/components/ui/skeleton";

const DUMMY_ACTION_WIDTHS = ["w-28", "w-24", "w-20"];

type HeaderProps = {
  showActions?: number;
  showEyebrow?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  titleWidth?: string;
};

function getActionWidth(index: number) {
  return DUMMY_ACTION_WIDTHS[index % DUMMY_ACTION_WIDTHS.length];
}

export function CompactHeaderSkeleton({
  showActions = 0,
  showEyebrow = true,
  showTitle = true,
  showDescription = true,
  titleWidth = "w-2/5",
}: HeaderProps) {
  return (
    <div className="mb-10">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0 flex-1">
          {showEyebrow ? <Skeleton className="h-3 w-28 mb-3" /> : null}
          {showTitle ? <Skeleton className={`h-12 ${titleWidth} max-w-xl`} /> : null}
          {showDescription ? <Skeleton className="mt-4 h-4 w-2/5 max-w-2xl" /> : null}
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
      <div className="aspect-[2/3] bg-surface-low border border-border flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <Skeleton className="absolute inset-0 h-full w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-4/5 mx-auto" />
        <Skeleton className="h-4 w-3/5 mx-auto" />
      </div>
    </div>
  );
}

export function ReviewPosterGridSkeleton({
  count = 12,
  className = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 md:gap-8",
  gap = "gap-8",
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
          className="border-b border-border pb-8 last:border-0 last:pb-0"
          key={`review-item-${index}`}
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
            <div className="space-y-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-8 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NodeReviewLayoutSkeleton() {
  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-start">
      <div className="bg-surface-low border border-border p-6">
        <ReviewListSkeleton rows={5} />
      </div>
      <div className="space-y-6">
        <div className="overflow-hidden border border-border bg-surface-low">
          <div className="aspect-[2/3] bg-surface-lowest">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
        <div className="bg-surface-low p-6 border border-border">
          <div className="space-y-6">
            <Skeleton className="h-4 w-16" />
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </div>
        <div className="bg-surface-low p-6 border border-border">
          <div className="space-y-6">
            <Skeleton className="h-4 w-16" />
            <div className="grid gap-px bg-foreground/5 overflow-hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="bg-surface-lowest p-3 space-y-2" key={`meta-row-${index}`}>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="ml-4 h-4 w-3/4" />
                </div>
              ))}
            </div>
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
        <div className="flex-1 max-w-4xl">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4">
            <Skeleton className="h-10 w-12" />
            <div className="space-y-4">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-11 w-5/6 max-w-3xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-start md:items-end gap-3">
          <div className="flex flex-col items-end gap-3">
            <div className="flex flex-wrap justify-end gap-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
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
        <div className="bg-surface-lowest p-6 border border-border">
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
      <div className="border border-border">
        <div className="grid grid-cols-[42%_20%_16%_22%] border-b border-border bg-surface-low px-3 py-3 gap-3">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-12" />
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div className="grid grid-cols-[42%_20%_16%_22%] items-center px-3 py-4 gap-3 border-b border-border last:border-0" key={`admin-row-${index}`}>
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-20" />
          </div>
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
