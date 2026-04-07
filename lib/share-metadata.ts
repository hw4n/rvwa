const TITLE_PART_LIMIT = 50;
const DEFAULT_SHARE_IMAGE_PATH = "/web-app-manifest-192x192.png";

export const SHARE_BRAND_SUFFIX = "R.";
export const SPOILER_SHARE_LABEL = "<스포일러 리뷰>";

export function compactShareText(value: string) {
  return value.replace(/[#>*`_\-\[\]\(\)]/g, " ").replace(/\s+/g, " ").trim();
}

export function truncateShareTitlePart(value: string, maxLength = TITLE_PART_LIMIT) {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export function buildBrandedTitle(parts: Array<string | null | undefined>) {
  const normalizedParts = parts
    .map((part) => truncateShareTitlePart(part ?? ""))
    .filter(Boolean);

  if (!normalizedParts.length) {
    return SHARE_BRAND_SUFFIX;
  }

  return `${normalizedParts.join(" - ")} - ${SHARE_BRAND_SUFFIX}`;
}

export function buildExcerpt(value: string, maxLength: number) {
  const normalized = compactShareText(value);
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function normalizeSiteOrigin(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return undefined;
  }

  try {
    return new URL(normalized).origin;
  } catch {
    try {
      return new URL(`https://${normalized}`).origin;
    } catch {
      return undefined;
    }
  }
}

export function getSiteOrigin() {
  return normalizeSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL)
    ?? normalizeSiteOrigin(process.env.NEXT_PUBLIC_APP_URL)
    ?? normalizeSiteOrigin(process.env.SITE_URL)
    ?? normalizeSiteOrigin(process.env.APP_URL)
    ?? normalizeSiteOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL)
    ?? normalizeSiteOrigin(process.env.VERCEL_URL);
}

export function getMetadataBase() {
  const origin = getSiteOrigin();
  return origin ? new URL(origin) : undefined;
}

export function getDefaultShareImageUrl() {
  const origin = getSiteOrigin();
  return origin ? `${origin}${DEFAULT_SHARE_IMAGE_PATH}` : DEFAULT_SHARE_IMAGE_PATH;
}
