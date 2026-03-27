import { notFound } from "next/navigation";
import { PlatformHeader } from "@/components/platform-header";
import { CategoryCreateForm } from "@/components/category-create-form";
import { requireAdmin } from "@/lib/auth";
import { getCategoryBySlug } from "@/lib/repository";

function decodeRouteSegment(value: string | undefined) {
  if (!value) {
    return "";
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  await requireAdmin();
  const { categorySlug } = await params;
  const normalizedCategorySlug = decodeRouteSegment(categorySlug);
  const category = await getCategoryBySlug(normalizedCategorySlug);

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-16">
      <PlatformHeader
        crumbs={[
          { label: "대시보드", href: "/dashboard" },
          { label: category.name, href: `/c/${category.slug}` },
          { label: "수정" },
        ]}
        description="카테고리 정보를 수정합니다."
        eyebrow="관리"
        title="카테고리 수정"
        variant="compact"
      />
      <CategoryCreateForm initialCategory={category} />
    </div>
  );
}
