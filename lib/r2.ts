import "server-only";

import crypto from "node:crypto";
import path from "node:path";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isAllowedPosterContentType, posterUploadMaxBytes } from "@/lib/poster";

const POSTER_OBJECT_PREFIX = "nodes/";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

let cachedClient: S3Client | null = null;

function getR2Client() {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });

  return cachedClient;
}

function normalizePublicBaseUrl() {
  return requireEnv("R2_PUBLIC_BASE_URL").replace(/\/+$/, "");
}

function getFileExtension(fileName: string, contentType: string) {
  const extension = path.extname(fileName).toLowerCase();
  if (extension) {
    return extension;
  }

  switch (contentType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/avif":
      return ".avif";
    default:
      return "";
  }
}

function buildPosterObjectKey(fileName: string, contentType: string) {
  return `${POSTER_OBJECT_PREFIX}${Date.now()}-${crypto.randomUUID()}${getFileExtension(fileName, contentType)}`;
}

export function getPosterObjectKeyFromPublicUrl(coverImageUrl: string) {
  const source = new URL(coverImageUrl);
  const publicBase = new URL(`${normalizePublicBaseUrl()}/`);
  const sourcePath = source.pathname.replace(/\/+$/, "");
  const basePath = publicBase.pathname.replace(/\/+$/, "");

  if (source.origin !== publicBase.origin) {
    throw new Error("Invalid poster URL");
  }

  if (basePath && !sourcePath.startsWith(basePath)) {
    throw new Error("Invalid poster URL");
  }

  const relativePath = sourcePath.slice(basePath.length).replace(/^\/+/, "");
  if (!relativePath) {
    throw new Error("Invalid poster URL");
  }

  const objectKey = decodeURIComponent(relativePath);
  if (!objectKey.startsWith(POSTER_OBJECT_PREFIX)) {
    throw new Error("Poster URL must point to a nodes/ object");
  }

  return objectKey;
}

export function getPosterPublicUrl(objectKey: string) {
  return `${normalizePublicBaseUrl()}/${objectKey}`;
}

export async function createPosterUpload(args: {
  fileName: string;
  contentType: string;
  size: number;
}) {
  if (!isAllowedPosterContentType(args.contentType)) {
    throw new Error("Unsupported content type");
  }

  if (!Number.isFinite(args.size) || args.size <= 0 || args.size > posterUploadMaxBytes) {
    throw new Error("Invalid upload size");
  }

  const objectKey = buildPosterObjectKey(args.fileName, args.contentType);
  const command = new PutObjectCommand({
    Bucket: requireEnv("R2_BUCKET"),
    Key: objectKey,
    ContentType: args.contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 60 });

  return {
    objectKey,
    uploadUrl,
    publicUrl: getPosterPublicUrl(objectKey),
  };
}

export async function deletePosterObject(coverImageUrl: string) {
  const objectKey = getPosterObjectKeyFromPublicUrl(coverImageUrl);
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: requireEnv("R2_BUCKET"),
      Key: objectKey,
    })
  );
  return { objectKey };
}
