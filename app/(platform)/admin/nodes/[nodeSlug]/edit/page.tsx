import { notFound } from "next/navigation";
import { PlatformHeader } from "@/components/platform-header";
import { NodeCreateForm } from "@/components/node-create-form";
import { requireAdmin } from "@/lib/auth";
import { getCategoryView, getNodeView } from "@/lib/repository";

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

export default async function EditNodePage({
  params,
}: {
  params: Promise<{ nodeSlug: string }>;
}) {
  await requireAdmin();
  const { nodeSlug } = await params;
  const normalizedNodeSlug = decodeRouteSegment(nodeSlug);
  const nodeView = await getNodeView(normalizedNodeSlug);

  if (!nodeView || !nodeView.category) {
    notFound();
  }

  const categoryView = await getCategoryView(nodeView.category.slug);
  if (!categoryView) {
    notFound();
  }

  return (
    <div className="space-y-16">
      <PlatformHeader
        crumbs={[
          { label: nodeView.category.name, href: `/c/${nodeView.category.slug}` },
          { label: nodeView.node.title, href: `/n/${nodeView.node.slug}` },
          { label: "수정" },
        ]}
        description="항목 정보를 수정합니다."
        eyebrow="관리"
        title="항목 수정"
        variant="compact"
      />
      <NodeCreateForm
        category={nodeView.category}
        initialNode={nodeView.node}
        nodes={categoryView.nodes.filter((entry) => entry.id !== nodeView.node.id)}
      />
    </div>
  );
}
