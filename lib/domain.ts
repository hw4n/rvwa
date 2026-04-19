export type CategorySlug = string;

export type AttributeValue = string | number | boolean | string[];
export type MetadataFieldType = "text" | "number" | "boolean" | "list";
export type MetadataFieldDefinition = {
  key: string;
  label: string;
  type: MetadataFieldType;
};

export type ExternalRef = {
  type: string;
  label?: string;
  url?: string;
  value?: string;
};

export type Category = {
  id: string;
  slug: CategorySlug;
  name: string;
  description: string;
  icon: string;
  accent: string;
  fieldDefinitions: MetadataFieldDefinition[];
};

export type ContentNode = {
  id: string;
  slug: string;
  title: string;
  categorySlug: CategorySlug;
  createdAt?: string;
  updatedAt?: string;
  nodeType?: string;
  parentId?: string;
  summary: string;
  coverImage?: string;
  rating?: number;
  status?: string;
  attributes: Record<string, AttributeValue>;
  externalRefs: ExternalRef[];
  tagSlugs: string[];
};

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "admin" | "member";
};

export type ReviewStatus = "draft" | "pending" | "approved" | "rejected";
export type ReviewVoteValue = "recommend" | "not_recommend";

export type Review = {
  id: string;
  nodeId?: string;
  nodeTitle?: string;
  nodeSlug?: string;
  categorySlug?: string;
  coverImage?: string;
  proposedTitle?: string;
  selectedCategorySlug?: string;
  suggestedCategoryName?: string;
  title?: string;
  body: string;
  rating?: number;
  recommendCount: number;
  notRecommendCount: number;
  commentCount: number;
  spoiler: boolean;
  status: ReviewStatus;
  author: UserSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type ReviewEngagement = {
  recommendCount: number;
  notRecommendCount: number;
  commentCount: number;
  viewerVote: ReviewVoteValue | null;
  canVote: boolean;
};

export type ReviewComment = {
  id: string;
  parentCommentId?: string;
  body: string;
  author: UserSummary | null;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  isMine: boolean;
  isReviewAuthor: boolean;
  canReply: boolean;
  canEdit: boolean;
  canDelete: boolean;
  replies: ReviewComment[];
};

export type ReviewDiscussion = {
  recommendCount: number;
  notRecommendCount: number;
  commentCount: number;
  viewerVote: ReviewVoteValue | null;
  canVote: boolean;
  canComment: boolean;
  comments: ReviewComment[];
  hasMore: boolean;
};

export type Collection = {
  id: string;
  slug: string;
  title: string;
  description: string;
  nodeSlugs: string[];
};

export type ReviewDraft = {
  title?: string;
  body: string;
  rating: string;
  spoiler: boolean;
};
