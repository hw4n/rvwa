import { notFound } from "next/navigation";
import { PlatformHeader } from "@/components/platform-header";
import { NodeCreateForm } from "@/components/node-create-form";
import { requireAdmin } from "@/lib/auth";
import { getCategoryView } from "@/lib/repository";

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

export default async function NewNodePage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  await requireAdmin();
  const { categorySlug } = await params;
  const normalizedCategorySlug = decodeRouteSegment(categorySlug);
  const view = await getCategoryView(normalizedCategorySlug);

  if (!view) {
    notFound();
  }

  return (
    <div className="space-y-16">
      <PlatformHeader
        crumbs={[
          { label: "대시보드", href: "/dashboard" },
          { label: view.category.name, href: `/c/${view.category.slug}` },
          { label: "항목 추가" },
        ]}
        description="선택한 카테고리에 새 항목을 추가합니다."
        eyebrow="관리"
        title="항목 추가"
        variant="compact"
      />
      <NodeCreateForm category={view.category} nodes={view.nodes} />
    </div>
  );
}
