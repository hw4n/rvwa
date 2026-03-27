import {
  CompactHeaderSkeleton,
  NodeReviewLayoutSkeleton,
} from "@/components/platform-loading-skeletons";

export default function NodeLoading() {
  return (
    <div className="space-y-8">
      <CompactHeaderSkeleton showActions={3} showEyebrow />
      <NodeReviewLayoutSkeleton />
    </div>
  );
}

