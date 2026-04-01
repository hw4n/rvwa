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
              <Skeleton key={`header-action-${index}`} className={`h-8 rounded-none ${getActionWidth(index)}`} />
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
        <Skeleton className="h-24 w-full rounded-none" key={`review-item-${index}`} />
      ))}
    </div>
  );
}

export function NodeReviewLayoutSkeleton() {
  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-start">
      <Skeleton className="h-[800px] w-full rounded-none" />
      <div className="space-y-6">
        <Skeleton className="aspect-[2/3] w-full rounded-none" />
        <Skeleton className="h-32 w-full rounded-none" />
        <Skeleton className="h-64 w-full rounded-none" />
      </div>
    </section>
  );
}

export function ReviewDetailSkeleton() {
  return (
    <article className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
        <div className="flex-1 max-w-4xl">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] lg:gap-8">
            <Skeleton className="aspect-[2/3] w-full max-w-44 rounded-none" />
            <Skeleton className="h-[400px] w-full rounded-none" />
          </div>
        </div>
      </div>
    </article>
  );
}

export function WritePageSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px] items-start">
      <Skeleton className="h-[800px] w-full rounded-none" />
      <aside className="sticky top-10 space-y-6">
        <Skeleton className="h-[400px] w-full rounded-none" />
      </aside>
    </div>
  );
}

export function AdminReviewListSkeleton() {
  return (
    <section className="space-y-4">
      <Skeleton className="h-[600px] w-full rounded-none" />
    </section>
  );
}

export function AdminEntityFormSkeleton() {
  return (
    <Skeleton className="h-[600px] w-full border-l-2 border-primary/50 rounded-none" />
  );
}
