export const reviewRatingMin = 0;
export const reviewRatingMax = 5;
export const reviewRatingStep = 0.001;

function roundToThreeDecimals(value: number) {
  return Math.round(value * 1000) / 1000;
}

function trimTrailingZeros(value: string) {
  return value.replace(/\.?0+$/, "");
}

export function normalizeStoredRating(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  const normalized = value > reviewRatingMax ? value / 20 : value;
  return roundToThreeDecimals(
    Math.min(reviewRatingMax, Math.max(reviewRatingMin, normalized))
  );
}

export function normalizeSubmittedRating(value: number | null | undefined) {
  if (value == null) {
    return undefined;
  }

  if (!Number.isFinite(value)) {
    throw new Error("점수는 숫자여야 합니다.");
  }

  if (value < reviewRatingMin || value > reviewRatingMax) {
    throw new Error("점수는 0점에서 5점 사이여야 합니다.");
  }

  return roundToThreeDecimals(value);
}

export function formatRatingInputValue(value: number | null | undefined) {
  const normalized = normalizeStoredRating(value);
  return normalized == null ? "" : trimTrailingZeros(normalized.toFixed(3));
}

export function formatCompactRating(value: number | null | undefined) {
  const normalized = normalizeStoredRating(value);
  return normalized == null ? "" : trimTrailingZeros(normalized.toFixed(1));
}

export function formatDetailedRating(value: number | null | undefined) {
  const normalized = normalizeStoredRating(value);
  return normalized == null ? "" : trimTrailingZeros(normalized.toFixed(3));
}
