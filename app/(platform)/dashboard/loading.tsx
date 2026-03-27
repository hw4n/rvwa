import {
  CompactHeaderSkeleton,
  ReviewPosterGridSkeleton,
} from "@/components/platform-loading-skeletons";

export default function DashboardLoading() {
  return (
    <div className="space-y-20">
      <CompactHeaderSkeleton showActions={1} showEyebrow={false} />
      <ReviewPosterGridSkeleton count={12} />
    </div>
  );
}

