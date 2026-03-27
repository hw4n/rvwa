import {
  CompactHeaderSkeleton,
  ReviewPosterGridSkeleton,
} from "@/components/platform-loading-skeletons";

export default function PlatformLoading() {
  return (
    <div className="space-y-20">
      <CompactHeaderSkeleton showActions={1} showEyebrow titleWidth="w-2/5" />
      <ReviewPosterGridSkeleton count={12} />
    </div>
  );
}
