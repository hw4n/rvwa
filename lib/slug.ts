export const CATEGORY_SLUG_INPUT_PATTERN = /^[\p{L}\p{N}\s-]+$/u;
export const ITEM_SLUG_INPUT_PATTERN = /^[\p{L}\p{N}\s-]+$/u;

export function isValidCategorySlugInput(value: string) {
  const trimmed = value.trim();
  return !trimmed || CATEGORY_SLUG_INPUT_PATTERN.test(trimmed);
}

export function isValidItemSlugInput(value: string) {
  const trimmed = value.trim();
  return !trimmed || ITEM_SLUG_INPUT_PATTERN.test(trimmed);
}
