import {
  CompactHeaderSkeleton,
  AdminReviewListSkeleton,
} from "@/components/platform-loading-skeletons";

export default function AdminLoading() {
  return (
    <div className="space-y-16">
      <CompactHeaderSkeleton showActions={0} showEyebrow={false} titleWidth="w-1/4" />
      <AdminReviewListSkeleton />
    </div>
  );
}

