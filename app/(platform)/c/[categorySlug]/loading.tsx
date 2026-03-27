import {
  CompactHeaderSkeleton,
  ReviewPosterGridSkeleton,
} from "@/components/platform-loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryLoading() {
  return (
    <div className="space-y-16">
      <CompactHeaderSkeleton showActions={2} showEyebrow={false} titleWidth="w-1/3" />
      <section className="space-y-6">
        <Skeleton className="h-4 w-20" />
        <ReviewPosterGridSkeleton count={10} />
      </section>
    </div>
  );
}
