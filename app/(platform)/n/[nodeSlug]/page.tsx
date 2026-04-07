import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NodeDeleteButton } from "@/components/node-delete-button";
import { NodeReviews } from "@/components/node-reviews";
import { PlatformHeader } from "@/components/platform-header";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";
import { sortAttributeEntries } from "@/lib/metadata";
import { getPosterImageUrl } from "@/lib/poster";
import { getNodeView } from "@/lib/repository";
import { buildBrandedTitle } from "@/lib/share-metadata";

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

export default async function NodePage({
  params,
}: {
  params: Promise<{ nodeSlug: string }>;
}) {
  const { nodeSlug } = await params;
  const normalizedNodeSlug = decodeRouteSegment(nodeSlug);
  const [view, viewer] = await Promise.all([getNodeView(normalizedNodeSlug), getViewer()]);

  if (!view) {
    notFound();
  }

  const { node, category } = view;
  const approvedReviews = view.reviews.filter((review) => review.status === "approved");
  const attributeEntries = sortAttributeEntries(node.attributes, category?.fieldDefinitions ?? []);

  return (
    <div className="space-y-8">
      <PlatformHeader
        eyebrow={category?.name ?? "Collection"}
        title={node.title}
        description={node.summary}
        titleClassName="text-2xl sm:text-3xl lg:text-4xl"
        crumbs={[
          category ? { label: category.name, href: `/c/${category.slug}` } : { label: "Inventory" },
          { label: node.title },
        ]}
        variant="compact"
        actions={
          <div className="flex flex-wrap gap-4">
            {viewer?.role === "admin" ? (
              <>
                <Button asChild className="rounded-none border-border hover:bg-foreground/5" variant="outline">
                  <Link href={`/admin/nodes/${node.slug}/edit`}>수정</Link>
                </Button>
                <NodeDeleteButton slug={node.slug} />
              </>
            ) : null}
          </div>
        }
      />

      <section className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-start">
          <div className="bg-surface-low border border-border p-5 sm:p-6">
            <NodeReviews reviews={approvedReviews} />
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden border border-border bg-surface-low">
              <div className="aspect-[2/3] bg-surface-lowest">
                {node.coverImage ? (
                  <Image
                    alt={node.title}
                    className="h-full w-full object-cover"
                    height={1080}
                    loading="lazy"
                    sizes="(max-width: 1280px) 100vw, 360px"
                    src={getPosterImageUrl(node.coverImage, "detail") ?? ""}
                    unoptimized
                    width={720}
                  />
                ) : null}
              </div>
            </div>

            <div className="bg-surface-low p-5 sm:p-6 border border-border">
              <div className="space-y-6">
                <p className="mt-1 text-xs font-black uppercase tracking-[0.24em] text-primary sm:text-[14px] sm:tracking-[0.3em]">Tags</p>
                <div className="flex flex-wrap gap-3">
                  {node.tagSlugs.length ? (
                    node.tagSlugs.map((tag) => (
                      <span
                        key={tag}
                        className="bg-surface-high border border-border px-2.5 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-foreground/40 sm:px-3 sm:text-[14px] sm:tracking-widest"
                      >
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-bold italic text-muted-foreground/20 sm:text-[14px]">No tags assigned</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-surface-low p-5 sm:p-6 border border-border">
              <div className="space-y-6">
                <p className="mt-1 text-xs font-black uppercase tracking-[0.24em] text-primary sm:text-[14px] sm:tracking-[0.3em]">Info</p>
                <div className="grid gap-px bg-foreground/5 overflow-hidden">
                  {attributeEntries.length ? (
                    attributeEntries.map(({ key, label, value }) => (
                      <div
                        key={key}
                        className="bg-surface-lowest p-3 transition-colors hover:bg-surface-low"
                      >
                        <div className="text-xs font-black uppercase tracking-[0.16em] text-foreground/20 sm:text-[14px] sm:tracking-[0.2em]">
                          {label}
                        </div>
                        <div className="ml-3 mt-1 text-xs font-bold text-foreground/80 sm:ml-4 sm:text-[14px]">
                          {Array.isArray(value) ? value.join(", ") : String(value)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-surface-lowest p-3">
                      <span className="text-xs font-bold italic text-muted-foreground/20 sm:text-[14px]">No attributes defined</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nodeSlug: string }>;
}): Promise<Metadata> {
  const { nodeSlug } = await params;
  const view = await getNodeView(decodeRouteSegment(nodeSlug));

  if (!view) {
    return {
      title: buildBrandedTitle(["항목을 찾을 수 없음"]),
      description: "존재하지 않는 항목입니다.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = buildBrandedTitle([view.node.title]);
  const description = view.node.summary;
  const imageUrl = getPosterImageUrl(view.node.coverImage, "card");

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "R.",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 360,
              height: 540,
              alt: view.node.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}
