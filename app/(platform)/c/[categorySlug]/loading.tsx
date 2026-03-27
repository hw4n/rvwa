import {
  CompactHeaderSkeleton,
  ReviewPosterGridSkeleton,
} from "@/components/platform-loading-skeletons";

export default function CategoryLoading() {
  return (
    <div className="space-y-16">
      <CompactHeaderSkeleton showActions={2} showEyebrow={false} titleWidth="w-1/3" />
      <section className="space-y-6">
        <ReviewPosterGridSkeleton count={10} gap="gap-6" />
      </section>
    </div>
  );
}
