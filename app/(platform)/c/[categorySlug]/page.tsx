import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryRootGrid } from "@/components/category-root-grid";
import { CategoryDeleteButton } from "@/components/category-delete-button";
import { PlatformHeader } from "@/components/platform-header";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";
import { getCategoryBySlug, getCategoryView } from "@/lib/repository";
import { buildBrandedTitle, getDefaultShareImageUrl } from "@/lib/share-metadata";

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
  const [category, viewer, categoryView] = await Promise.all([
    getCategoryBySlug(normalizedCategorySlug),
    getViewer(),
    getCategoryView(normalizedCategorySlug),
  ]);

  if (!category) {
    notFound();
  }

  const hasStudioField = category.fieldDefinitions.some((field) => field.key === "studio");
  const hasTimelineField = category.fieldDefinitions.some((field) => field.key === "airing-quarter");

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
              <Button asChild className="rounded-none border-border hover:bg-foreground/5" variant="outline">
                <Link href={`/admin/categories/${category.slug}/edit`}>수정</Link>
              </Button>
            ) : null}
            {viewer?.role === "admin" && category.slug !== "uncategorized" ? <CategoryDeleteButton slug={category.slug} /> : null}
            {viewer?.role === "admin" ? (
              <Button asChild className="rounded-none bg-primary text-primary-foreground hover:bg-primary/80">
                <Link href={`/admin/nodes/new/${category.slug}`}>항목 추가</Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <CategoryRootGrid
        categorySlug={category.slug}
        groupedNodes={categoryView?.roots}
        hasStudioField={hasStudioField}
        hasTimelineField={hasTimelineField}
      />
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(decodeRouteSegment(categorySlug));

  if (!category) {
    return {
      title: buildBrandedTitle(["카테고리를 찾을 수 없음"]),
      description: "존재하지 않는 카테고리입니다.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = buildBrandedTitle([category.name]);
  const description = category.description;
  const imageUrl = getDefaultShareImageUrl();

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "R.",
      images: [
        {
          url: imageUrl,
          width: 192,
          height: 192,
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [imageUrl],
    },
  };
}
