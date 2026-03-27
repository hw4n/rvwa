import { PlatformHeader } from "@/components/platform-header";
import { CategoryCreateForm } from "@/components/category-create-form";
import { requireAdmin } from "@/lib/auth";

export default async function NewCategoryPage() {
  await requireAdmin();

  return (
    <div className="space-y-16">
      <PlatformHeader
        crumbs={[{ label: "대시보드", href: "/dashboard" }, { label: "카테고리" }]}
        description="새 카테고리를 추가합니다."
        eyebrow="관리"
        title="카테고리 추가"
        variant="compact"
      />
      <CategoryCreateForm />
    </div>
  );
}
