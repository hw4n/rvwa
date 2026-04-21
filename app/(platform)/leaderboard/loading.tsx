import { CompactHeaderSkeleton } from "@/components/platform-loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="space-y-8">
      <CompactHeaderSkeleton showActions={0} />
      <Skeleton className="h-[28rem] w-full max-w-3xl rounded-xl" />
    </div>
  );
}
