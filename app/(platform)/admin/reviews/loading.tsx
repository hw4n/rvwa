import {
  CompactHeaderSkeleton,
  AdminReviewListSkeleton,
} from "@/components/platform-loading-skeletons";

export default function AdminReviewLoading() {
  return (
    <div className="space-y-16">
      <CompactHeaderSkeleton showActions={0} showDescription={false} showEyebrow={false} showTitle={false} />
      <AdminReviewListSkeleton />
    </div>
  );
}
