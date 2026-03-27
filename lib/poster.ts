export const posterUploadMaxBytes = 10 * 1024 * 1024;

export const allowedPosterContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export type PosterVariant = "card" | "detail";

const posterVariantOptions: Record<
  PosterVariant,
  { width: number; height: number; quality: number }
> = {
  card: { width: 360, height: 540, quality: 85 },
  detail: { width: 720, height: 1080, quality: 90 },
};

export function isAllowedPosterContentType(value: string) {
  return allowedPosterContentTypes.includes(
    value as (typeof allowedPosterContentTypes)[number]
  );
}

export function validatePosterFile(file: File) {
  if (!isAllowedPosterContentType(file.type)) {
    throw new Error("jpg, png, webp, avif 이미지만 업로드할 수 있습니다.");
  }

  if (file.size > posterUploadMaxBytes) {
    throw new Error("포스터 이미지는 10MB 이하만 업로드할 수 있습니다.");
  }
}

export function getPosterImageUrl(
  coverImage: string | undefined,
  variant: PosterVariant
) {
  if (!coverImage) {
    return undefined;
  }

  const trimmed = coverImage.trim();
  if (!trimmed) {
    return undefined;
  }

  const imageBase = process.env.NEXT_PUBLIC_R2_IMAGE_BASE_URL?.trim();
  if (!imageBase) {
    return trimmed;
  }

  try {
    const source = new URL(trimmed);
    const base = new URL(imageBase);
    const options = posterVariantOptions[variant];
    base.pathname = `/cdn-cgi/image/width=${options.width},height=${options.height},fit=cover,quality=${options.quality}${source.pathname}`;
    base.search = "";
    return base.toString();
  } catch {
    return trimmed;
  }
}
