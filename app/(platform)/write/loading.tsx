import { WritePageSkeleton } from "@/components/platform-loading-skeletons";

export default function WriteLoading() {
  return (
    <div className="flex flex-1 flex-col space-y-12">
      <WritePageSkeleton />
    </div>
  );
}

