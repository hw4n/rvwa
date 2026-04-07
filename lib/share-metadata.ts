const TITLE_PART_LIMIT = 50;

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
