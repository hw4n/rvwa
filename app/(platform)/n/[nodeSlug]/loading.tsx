import {
  CompactHeaderSkeleton,
  NodeReviewLayoutSkeleton,
} from "@/components/platform-loading-skeletons";

export default function NodeLoading() {
  return (
    <div className="space-y-8">
      <CompactHeaderSkeleton showActions={2} showEyebrow titleWidth="w-1/3" />
      <NodeReviewLayoutSkeleton />
    </div>
  );
}
