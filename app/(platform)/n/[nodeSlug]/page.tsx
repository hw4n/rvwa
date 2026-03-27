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
        crumbs={[
          category ? { label: category.name, href: `/c/${category.slug}` } : { label: "Inventory" },
          { label: node.title },
        ]}
        variant="compact"
        actions={
          <div className="flex flex-wrap gap-4">
            {viewer?.role === "admin" ? (
              <>
                <Button asChild className="rounded-none border-white/10 hover:bg-white/5" variant="outline">
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
          <div className="bg-surface-low border border-white/5 p-6">
            <NodeReviews reviews={approvedReviews} />
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden border border-white/5 bg-surface-low">
              <div className="aspect-[2/3] bg-[#0e0e0e]">
                {node.coverImage ? (
                  <Image
                    alt={node.title}
                    className="h-full w-full object-cover"
                    height={1080}
                    loading="lazy"
                    sizes="(max-width: 1280px) 100vw, 360px"
                    src={getPosterImageUrl(node.coverImage, "detail") ?? ""}
                    width={720}
                  />
                ) : null}
              </div>
            </div>

            <div className="bg-surface-low p-6 border border-white/5">
              <div className="space-y-6">
                <p className="text-[14px] font-black text-primary uppercase tracking-[0.3em] mt-1">Tags</p>
                <div className="flex flex-wrap gap-3">
                  {node.tagSlugs.length ? (
                    node.tagSlugs.map((tag) => (
                      <span
                        key={tag}
                        className="bg-surface-high border border-white/5 px-3 py-1.5 text-[14px] font-black uppercase tracking-widest text-white/40"
                      >
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-[14px] font-bold text-[#c2c6d8]/20 italic">No tags assigned</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-surface-low p-6 border border-white/5">
              <div className="space-y-6">
                <p className="text-[14px] font-black text-primary uppercase tracking-[0.3em] mt-1">Info</p>
                <div className="grid gap-px bg-white/5 overflow-hidden">
                  {attributeEntries.length ? (
                    attributeEntries.map(({ key, label, value }) => (
                      <div
                        key={key}
                        className="bg-surface-lowest p-3 transition-colors hover:bg-surface-low"
                      >
                        <div className="text-[14px] font-black text-white/20 uppercase tracking-[0.2em]">
                          {label}
                        </div>
                        <div className="ml-4 mt-1 text-[14px] font-bold text-white/80">
                          {Array.isArray(value) ? value.join(", ") : String(value)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-surface-lowest p-3">
                      <span className="text-[14px] font-bold text-[#c2c6d8]/20 italic">No attributes defined</span>
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
