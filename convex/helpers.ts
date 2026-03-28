/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthUserId } from "@convex-dev/auth/server";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { MetadataFieldType } from "../lib/domain";
import { normalizeStoredRating } from "../lib/review-rating";

type AppCtx = GenericMutationCtx<any> | GenericQueryCtx<any>;
type UserRole = "admin" | "member";
const NORMALIZED_SLUG_PATTERN = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;
const metadataFieldTypes = new Set<MetadataFieldType>(["text", "number", "boolean", "list"]);
export const INPUT_LIMITS = {
  handle: 40,
  categoryName: 80,
  categoryDescription: 500,
  icon: 64,
  metadataFieldCount: 24,
  metadataFieldKey: 64,
  metadataFieldLabel: 80,
  nodeTitle: 120,
  nodeSummary: 2000,
  tagCount: 30,
  tagLength: 40,
  reviewTitle: 160,
  reviewBody: 20000,
  suggestedCategoryName: 80,
  metadataTextValue: 500,
  metadataListCount: 20,
  metadataListItemLength: 120,
} as const;

export function nowIso() {
  return new Date().toISOString();
}

function ensureMaxLength(value: string, label: string, maxLength: number) {
  if (value.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer`);
  }
  return value;
}

export function sanitizeRequiredText(value: string, label: string, maxLength: number) {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${label} is required`);
  }
  return ensureMaxLength(normalized, label, maxLength);
}

export function sanitizeOptionalText(value: string | null | undefined, label: string, maxLength: number) {
  if (value == null) {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  return ensureMaxLength(normalized, label, maxLength);
}

export function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function assertExplicitSlug(value: string, label = "Slug") {
  const normalized = normalizeSlug(value);
  if (!normalized || !NORMALIZED_SLUG_PATTERN.test(normalized)) {
    throw new Error(`${label} is invalid`);
  }
  return normalized;
}

export function assertNormalizedSlug(value: string, label = "Slug") {
  const normalized = normalizeSlug(value);
  if (!normalized || !NORMALIZED_SLUG_PATTERN.test(normalized)) {
    throw new Error(`${label} is invalid`);
  }
  return normalized;
}

export function parseTagInput(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  );
}

export function normalizeMetadataKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 _-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function sanitizeFieldDefinitions(
  fieldDefinitions: Array<{ key: string; label: string; type: string }>
) {
  if (fieldDefinitions.length > INPUT_LIMITS.metadataFieldCount) {
    throw new Error(`Metadata fields must be ${INPUT_LIMITS.metadataFieldCount} or fewer`);
  }

  const seenKeys = new Set<string>();

  return fieldDefinitions.map((field, index) => {
    const key = normalizeMetadataKey(field.key);
    const label = sanitizeRequiredText(
      field.label,
      `Metadata field ${index + 1} label`,
      INPUT_LIMITS.metadataFieldLabel
    );

    if (!key) {
      throw new Error(`Metadata field ${index + 1} key is required`);
    }

    ensureMaxLength(key, `Metadata field ${index + 1} key`, INPUT_LIMITS.metadataFieldKey);

    if (!metadataFieldTypes.has(field.type as MetadataFieldType)) {
      throw new Error(`Metadata field ${index + 1} type is invalid`);
    }

    if (seenKeys.has(key)) {
      throw new Error(`Metadata field key "${key}" is duplicated`);
    }

    seenKeys.add(key);
    return {
      key,
      label,
      type: field.type as MetadataFieldType,
    };
  });
}

function sanitizeAttributeValue(
  key: string,
  type: MetadataFieldType,
  value: unknown
) {
  if (type === "boolean") {
    if (typeof value !== "boolean") {
      throw new Error(`Metadata "${key}" must be boolean`);
    }
    return value;
  }

  if (type === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`Metadata "${key}" must be number`);
    }
    return value;
  }

  if (type === "list") {
    if (!Array.isArray(value)) {
      throw new Error(`Metadata "${key}" must be list`);
    }

    if (value.length > INPUT_LIMITS.metadataListCount) {
      throw new Error(`Metadata "${key}" must contain ${INPUT_LIMITS.metadataListCount} items or fewer`);
    }

    const normalized = value
      .map((entry) =>
        sanitizeRequiredText(String(entry), `Metadata "${key}" entry`, INPUT_LIMITS.metadataListItemLength)
      )
      .filter(Boolean);
    return normalized.length ? normalized : undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`Metadata "${key}" must be text`);
  }

  const normalized = value.trim();
  ensureMaxLength(normalized, `Metadata "${key}"`, INPUT_LIMITS.metadataTextValue);
  return normalized || undefined;
}

function inferAttributeType(value: unknown): MetadataFieldType {
  if (Array.isArray(value)) {
    return "list";
  }

  if (typeof value === "boolean") {
    return "boolean";
  }

  if (typeof value === "number") {
    return "number";
  }

  return "text";
}

export function sanitizeAttributes(
  attributes: Record<string, unknown>,
  fieldDefinitions: Array<{ key: string; type: MetadataFieldType }>
) {
  if (Object.keys(attributes).length > INPUT_LIMITS.metadataFieldCount) {
    throw new Error(`Metadata fields must be ${INPUT_LIMITS.metadataFieldCount} or fewer`);
  }

  const expectedTypes = new Map(fieldDefinitions.map((field) => [field.key, field.type]));
  const sanitized: Record<string, any> = {};

  for (const [rawKey, rawValue] of Object.entries(attributes)) {
    const key = normalizeMetadataKey(rawKey);
    if (!key) {
      throw new Error("Metadata key is invalid");
    }

    ensureMaxLength(key, "Metadata key", INPUT_LIMITS.metadataFieldKey);

    const type = expectedTypes.get(key) ?? inferAttributeType(rawValue);
    const value = sanitizeAttributeValue(key, type, rawValue);
    if (value !== undefined) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function sanitizeTagList(tags: string[]) {
  if (tags.length > INPUT_LIMITS.tagCount) {
    throw new Error(`Tags must be ${INPUT_LIMITS.tagCount} or fewer`);
  }

  return Array.from(
    new Set(
      tags
        .map((tag) => sanitizeRequiredText(tag, "Tag", INPUT_LIMITS.tagLength))
        .filter(Boolean)
    )
  );
}

export function resolveUserRole(user: { email?: string | null; role?: UserRole | null }): UserRole {
  return user.role ?? "member";
}

export async function getViewerDoc(ctx: AppCtx) {
  const userId = await getAuthUserId(ctx);
  const user = userId ? await ctx.db.get(userId) : null;
  return user ? { ...user, role: resolveUserRole(user) } : null;
}

export async function requireViewer(ctx: AppCtx) {
  const viewer = await getViewerDoc(ctx);
  if (!viewer) {
    throw new Error("Authentication required");
  }
  return viewer;
}

export async function requireAdmin(ctx: AppCtx) {
  const viewer = await requireViewer(ctx);
  if (viewer.role !== "admin") {
    throw new Error("Admin only");
  }
  return viewer;
}

export function toUserSummary(user: {
  _id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole | null;
}) {
  const email = user.email ?? "";
  const fallbackName = email.split("@")[0] || "member";

  return {
    id: user._id,
    name: user.name || fallbackName,
    email,
    avatar: user.image ?? "",
    role: resolveUserRole(user),
  };
}

export function toCategory(category: {
  _id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  accent?: string | null;
  fieldDefinitions?: Array<{
    key: string;
    label: string;
    type: MetadataFieldType;
  }> | null;
}) {
  return {
    id: category._id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    icon: category.icon,
    accent: category.accent ?? "",
    fieldDefinitions: category.fieldDefinitions ?? [],
  };
}

export function toNode(node: {
  _id: string;
  slug: string;
  title: string;
  categorySlug: string;
  createdAt: string;
  updatedAt: string;
  nodeType?: string | null;
  parentId?: string | null;
  summary: string;
  coverImage?: string | null;
  rating?: number | null;
  status?: string | null;
  attributes: Record<string, any>;
  externalRefs: Array<{ type: string; label?: string; url?: string; value?: string }>;
  tagSlugs: string[];
}) {
  return {
    id: node._id,
    slug: node.slug,
    title: node.title,
    categorySlug: node.categorySlug,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    nodeType: node.nodeType,
    parentId: node.parentId ?? undefined,
    summary: node.summary,
    coverImage: node.coverImage ?? undefined,
    rating: normalizeStoredRating(node.rating),
    status: node.status ?? undefined,
    attributes: node.attributes,
    externalRefs: node.externalRefs,
    tagSlugs: node.tagSlugs,
  };
}

export async function toReview(
  ctx: AppCtx,
  review: {
    _id: string;
    nodeId?: string | null;
    authorId: string;
    proposedTitle?: string | null;
    selectedCategorySlug?: string | null;
    suggestedCategoryName?: string | null;
    title?: string | null;
    body: string;
    rating?: number | null;
    spoiler: boolean;
    status: "draft" | "pending" | "approved" | "rejected";
    createdAt: string;
    updatedAt: string;
  }
) {
  const author = await ctx.db.get(review.authorId as any);
  const node = review.nodeId ? await ctx.db.get(review.nodeId as any) : null;

  return {
    id: review._id,
    nodeId: review.nodeId ?? undefined,
    nodeTitle: node?.title ?? undefined,
    nodeSlug: node?.slug ?? undefined,
    categorySlug: node?.categorySlug ?? review.selectedCategorySlug ?? undefined,
    coverImage: node?.coverImage ?? undefined,
    proposedTitle: review.proposedTitle ?? undefined,
    selectedCategorySlug: review.selectedCategorySlug ?? undefined,
    suggestedCategoryName: review.suggestedCategoryName ?? undefined,
    title: review.title ?? undefined,
    body: review.body,
    rating: normalizeStoredRating(review.rating),
    spoiler: review.spoiler,
    status: review.status,
    author: author ? toUserSummary(author as any) : null,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

export function canReadReview(
  viewer: { _id: string; role?: "admin" | "member" } | null,
  review: { authorId: string; status: "draft" | "pending" | "approved" | "rejected" }
) {
  if (review.status === "approved") {
    return true;
  }

  if (!viewer) {
    return false;
  }

  if (viewer.role === "admin") {
    return true;
  }

  return viewer._id === review.authorId;
}
