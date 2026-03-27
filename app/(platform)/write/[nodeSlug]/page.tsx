import { redirect } from "next/navigation";

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

export default async function LegacyWritePage({
  params,
}: {
  params: Promise<{ nodeSlug: string }>;
}) {
  const { nodeSlug } = await params;
  const normalizedNodeSlug = decodeRouteSegment(nodeSlug);
  redirect(`/write?item=${encodeURIComponent(normalizedNodeSlug)}`);
}
