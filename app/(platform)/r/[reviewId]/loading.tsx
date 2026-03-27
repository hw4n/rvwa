import { ReviewDetailSkeleton } from "@/components/platform-loading-skeletons";

export default function ReviewLoading() {
  return (
    <div className="space-y-8">
      <div className="max-w-5xl mx-auto">
        <ReviewDetailSkeleton />
      </div>
    </div>
  );
}

