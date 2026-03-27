import { ReviewPosterGridSkeleton } from "@/components/platform-loading-skeletons";

export default function MyReviewsLoading() {
  return (
    <div className="space-y-6">
      <ReviewPosterGridSkeleton count={10} />
    </div>
  );
}

