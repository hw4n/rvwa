import { DashboardReviewGrid } from "@/components/dashboard-review-grid";
import { PlatformHeader } from "@/components/platform-header";

export default function DashboardPage() {
  return (
    <div className="space-y-10 md:space-y-20">
      <PlatformHeader
        eyebrow=""
        title=""
        crumbs={[{ label: "대시보드" }]}
        variant="compact"
      />

      <DashboardReviewGrid />
    </div>
  );
}
