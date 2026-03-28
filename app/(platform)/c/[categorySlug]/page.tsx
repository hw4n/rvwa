import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryRootGrid } from "@/components/category-root-grid";
import { CategoryDeleteButton } from "@/components/category-delete-button";
import { PlatformHeader } from "@/components/platform-header";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";
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

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const normalizedCategorySlug = decodeRouteSegment(categorySlug);
  const [category, viewer] = await Promise.all([getCategoryBySlug(normalizedCategorySlug), getViewer()]);

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-10 md:space-y-16">
      <PlatformHeader
        eyebrow={category.slug}
        title={category.name}
        description={category.description}
        crumbs={[{ label: "대시보드", href: "/dashboard" }, { label: category.name }]}
        variant="compact"
        actionsOutside
        actions={
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            {viewer?.role === "admin" ? (
              <Button asChild className="rounded-none border-white/10 hover:bg-white/5" variant="outline">
                <Link href={`/admin/categories/${category.slug}/edit`}>수정</Link>
              </Button>
            ) : null}
            {viewer?.role === "admin" && category.slug !== "uncategorized" ? <CategoryDeleteButton slug={category.slug} /> : null}
            {viewer?.role === "admin" ? (
              <Button asChild className="rounded-none bg-primary text-black hover:bg-primary/80">
                <Link href={`/admin/nodes/new/${category.slug}`}>항목 추가</Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <CategoryRootGrid categorySlug={category.slug} />
    </div>
  );
}
