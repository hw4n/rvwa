export const CATEGORY_SLUG_INPUT_PATTERN = /^[\p{L}\p{N}\s-]+$/u;
export const ITEM_SLUG_INPUT_PATTERN = /^[\p{L}\p{N}\s-]+$/u;

export function normalizeSearchSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidCategorySlugInput(value: string) {
  const trimmed = value.trim();
  return !trimmed || CATEGORY_SLUG_INPUT_PATTERN.test(trimmed);
}

export function isValidItemSlugInput(value: string) {
  const trimmed = value.trim();
  return !trimmed || ITEM_SLUG_INPUT_PATTERN.test(trimmed);
}
