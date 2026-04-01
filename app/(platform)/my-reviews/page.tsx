import { MyReviewsGrid } from "@/components/my-reviews-grid";
import { requireViewer } from "@/lib/auth";

export default async function MyReviewsPage() {
  await requireViewer();

  return (
    <div className="space-y-6">
      <MyReviewsGrid />
    </div>
  );
}
