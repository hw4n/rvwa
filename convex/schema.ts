import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const authTablesWithoutUsers = Object.fromEntries(
  Object.entries(authTables).filter(([tableName]) => tableName !== "users")
) as Omit<typeof authTables, "users">;

const metadataFieldDefinition = v.object({
  key: v.string(),
  label: v.string(),
  type: v.union(
    v.literal("text"),
    v.literal("number"),
    v.literal("boolean"),
    v.literal("list")
  ),
});

const externalRef = v.object({
  type: v.string(),
  label: v.optional(v.string()),
  url: v.optional(v.string()),
  value: v.optional(v.string()),
});

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.union(v.literal("admin"), v.literal("member")),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  ...authTablesWithoutUsers,

  categories: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    accent: v.optional(v.string()),
    fieldDefinitions: v.optional(v.array(metadataFieldDefinition)),
    createdBy: v.optional(v.id("users")),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_slug", ["slug"]),

  nodes: defineTable({
    slug: v.string(),
    title: v.string(),
    categorySlug: v.string(),
    nodeType: v.optional(v.string()),
    parentId: v.optional(v.id("nodes")),
    summary: v.string(),
    coverImage: v.optional(v.string()),
    status: v.optional(v.string()),
    // Deprecated. Kept optional until existing documents are cleaned up.
    tagline: v.optional(v.string()),
    attributes: v.record(v.string(), v.any()),
    externalRefs: v.array(externalRef),
    tagSlugs: v.array(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["categorySlug"])
    .index("by_parent", ["parentId"]),

  reviews: defineTable({
    nodeId: v.optional(v.id("nodes")),
    authorId: v.id("users"),
    proposedTitle: v.optional(v.string()),
    selectedCategorySlug: v.optional(v.string()),
    suggestedCategoryName: v.optional(v.string()),
    title: v.optional(v.string()),
    body: v.string(),
    rating: v.optional(v.number()),
    spoiler: v.boolean(),
    status: v.union(
      v.literal("draft"),
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
    submittedAt: v.optional(v.string()),
    approvedAt: v.optional(v.string()),
    approvedBy: v.optional(v.id("users")),
    rejectedAt: v.optional(v.string()),
    rejectedBy: v.optional(v.id("users")),
  })
    .index("by_node", ["nodeId"])
    .index("by_author", ["authorId"])
    .index("by_status", ["status"])
    .index("by_status_and_updated_at", ["status", "updatedAt"]),

  collections: defineTable({
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    nodeSlugs: v.array(v.string()),
  }).index("by_slug", ["slug"]),
});
