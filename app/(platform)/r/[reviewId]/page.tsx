import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewDeleteButton } from "@/components/review-delete-button";
import { ReviewRejectButton } from "@/components/review-reject-button";
import { ReviewDiscussion } from "@/components/review-discussion";
import { Button } from "@/components/ui/button";
import { ReviewDetail } from "@/components/review-detail";
import { getViewer } from "@/lib/auth";
import { getPosterImageUrl } from "@/lib/poster";
import { getReviewExplicitTitle } from "@/lib/review-display";
import { getReviewByIdForShare } from "@/lib/repository";
import {
  buildBrandedTitle,
  buildExcerpt,
  getDefaultShareImageUrl,
  SPOILER_SHARE_LABEL,
} from "@/lib/share-metadata";

const EMBED_DESCRIPTION_LIMIT = 220;
function getReviewEmbedHeading(review: {
  spoiler: boolean;
  title?: string;
  body: string;
}) {
  const explicitTitle = getReviewExplicitTitle(review);
  if (explicitTitle) {
    return explicitTitle;
  }

  return buildExcerpt(review.body, 50) || "리뷰";
}

function getReviewEmbedContentTitle(review: {
  nodeTitle?: string;
  proposedTitle?: string;
}) {
  return review.nodeTitle ?? review.proposedTitle ?? "리뷰";
}

function getReviewEmbedDescription(review: {
  spoiler: boolean;
  body: string;
}) {
  if (review.spoiler) {
    return SPOILER_SHARE_LABEL;
  }

  const excerpt = buildExcerpt(review.body, EMBED_DESCRIPTION_LIMIT);
  if (!excerpt) {
    return "리뷰 내용이 없습니다.";
  }

  return excerpt;
}

const getSharedReview = cache(async (reviewId: string) => {
  return await getReviewByIdForShare(reviewId);
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}): Promise<Metadata> {
  const { reviewId } = await params;
  const review = await getSharedReview(reviewId);

  if (!review) {
    return {
      title: "리뷰를 찾을 수 없음",
      description: "존재하지 않거나 열 수 없는 리뷰입니다.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = review.spoiler
    ? buildBrandedTitle([
      getReviewEmbedContentTitle(review),
      SPOILER_SHARE_LABEL,
    ])
    : buildBrandedTitle([
      getReviewEmbedContentTitle(review),
      getReviewEmbedHeading(review),
    ]);
  const description = getReviewEmbedDescription(review);
  const imageUrl = getPosterImageUrl(review.coverImage, "card") ?? getDefaultShareImageUrl();
  const isApproved = review.status === "approved";

  return {
    title,
    description,
    robots: isApproved
      ? undefined
      : {
        index: false,
        follow: false,
      },
    openGraph: {
      type: "article",
      title,
      description,
      siteName: "R.",
      images: [
        {
          url: imageUrl,
          width: review.coverImage ? 360 : 192,
          height: review.coverImage ? 540 : 192,
          alt: title,
        },
      ],
    },
    twitter: {
      card: review.coverImage ? "summary_large_image" : "summary",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  const [review, viewer] = await Promise.all([getSharedReview(reviewId), getViewer()]);

  if (!review) {
    notFound();
  }

  const isOwner = viewer?.id === review.author?.id;
  const isAdmin = viewer?.role === "admin";

  const actions = (isOwner || isAdmin) ? (
    <div className="flex flex-wrap gap-3">
      {isOwner ? (
        <Button
          className="rounded-none uppercase tracking-[0.15em] text-primary-foreground"
          asChild
        >
          <Link href={`/write?review=${review.id}`}>수정</Link>
        </Button>
      ) : null}
      {isAdmin && review.status !== "rejected" ? (
        <ReviewRejectButton reviewId={review.id} />
      ) : null}
      {isOwner ? (
        <ReviewDeleteButton
          reviewId={review.id}
          redirectHref={isAdmin ? "/dashboard" : "/my-reviews"}
        />
      ) : isAdmin ? (
        <ReviewDeleteButton reviewId={review.id} redirectHref="/dashboard" />
      ) : null}
    </div>
  ) : null;

  return (
    <div className="space-y-8">
      <div className="max-w-5xl mx-auto space-y-12 pb-24">
        <ReviewDetail review={review} actions={actions} />
        {review.status === "approved" ? (
          <ReviewDiscussion reviewId={review.id} />
        ) : null}
      </div>
    </div>
  );
}
