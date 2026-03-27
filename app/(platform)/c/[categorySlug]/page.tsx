import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryDeleteButton } from "@/components/category-delete-button";
import { PosterRatingBadge } from "@/components/poster-rating-badge";
import { PlatformHeader } from "@/components/platform-header";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";
import { getPosterImageUrl } from "@/lib/poster";
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

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const normalizedCategorySlug = decodeRouteSegment(categorySlug);
  const [view, viewer] = await Promise.all([getCategoryView(normalizedCategorySlug), getViewer()]);

  if (!view) {
    notFound();
  }

  const { category, roots } = view;

  return (
    <div className="space-y-16">
      <PlatformHeader
        eyebrow={category.slug}
        title={category.name}
        description={category.description}
        crumbs={[{ label: "대시보드", href: "/dashboard" }, { label: category.name }]}
        variant="compact"
        actions={
          <div className="flex gap-4">
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

      <section className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {roots.map((node) => (
            <Link
              key={node.id}
              href={`/n/${node.slug}`}
              className="group space-y-4"
            >
              <div className="aspect-[2/3] bg-surface-low border border-white/5 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-all group-hover:scale-[1.02] group-hover:border-primary/30">
                 {node.coverImage ? (
                   <Image
                     alt={node.title}
                     className="absolute inset-0 h-full w-full object-cover"
                     fill
                     loading="lazy"
                     sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                     src={getPosterImageUrl(node.coverImage, "card") ?? ""}
                   />
                 ) : null}
                 <PosterRatingBadge rating={node.rating} />
                 <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
                 {!node.coverImage ? (
                   <span className="text-6xl font-black text-white/5 tracking-tighter uppercase mb-4 select-none group-hover:scale-110 transition-transform">
                     {node.title.charAt(0)}
                   </span>
                 ) : null}
                 <div className="relative z-10 mt-auto flex flex-col items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                   <div className="w-6 h-px bg-primary/20" />
                 </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-1 text-center">
                  {node.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
