import { PlatformHeader } from "@/components/platform-header";
import { ReviewModerationList } from "@/components/review-moderation-list";
import { requireAdmin } from "@/lib/auth";

export default async function AdminReviewsPage() {
  await requireAdmin();

  return (
    <div className="space-y-16">
      <PlatformHeader
        actions={undefined}
        crumbs={[{ label: "대시보드", href: "/dashboard" }, { label: "검토" }]}
        description=""
        eyebrow=""
        title=""
        variant="compact"
      />
      <ReviewModerationList />
    </div>
  );
}
