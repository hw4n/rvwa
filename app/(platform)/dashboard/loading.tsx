import {
  CompactHeaderSkeleton,
  ReviewPosterGridSkeleton,
} from "@/components/platform-loading-skeletons";

export default function DashboardLoading() {
  return (
    <div className="space-y-20">
      <CompactHeaderSkeleton showActions={0} showDescription={false} showEyebrow={false} showTitle={false} />
      <ReviewPosterGridSkeleton count={12} />
    </div>
  );
}
