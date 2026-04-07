import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewDeleteButton } from "@/components/review-delete-button";
import { ReviewRejectButton } from "@/components/review-reject-button";
import { Button } from "@/components/ui/button";
import { ReviewDetail } from "@/components/review-detail";
import { getViewer } from "@/lib/auth";
import { getPosterImageUrl } from "@/lib/poster";
import { getReviewExplicitTitle } from "@/lib/review-display";
import { getReviewByIdForShare } from "@/lib/repository";

const EMBED_DESCRIPTION_LIMIT = 220;
const SPOILER_LABEL = "<스포일러 리뷰>";

function compactText(value: string) {
  return value.replace(/[#>*`_\-\[\]\(\)]/g, " ").replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function getReviewEmbedTitle(review: {
  spoiler: boolean;
  title?: string;
  nodeTitle?: string;
  proposedTitle?: string;
}) {
  if (review.spoiler) {
    return SPOILER_LABEL;
  }

  const explicitTitle = getReviewExplicitTitle(review);
  if (explicitTitle) {
    return explicitTitle;
  }

  return review.nodeTitle ?? review.proposedTitle ?? "리뷰";
}

function getReviewEmbedDescription(review: {
  spoiler: boolean;
  body: string;
}) {
  if (review.spoiler) {
    return SPOILER_LABEL;
  }

  const compactBody = compactText(review.body);
  if (!compactBody) {
    return "리뷰 내용이 없습니다.";
  }

  return truncateText(compactBody, EMBED_DESCRIPTION_LIMIT);
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

  const title = getReviewEmbedTitle(review);
  const description = getReviewEmbedDescription(review);
  const imageUrl = getPosterImageUrl(review.coverImage, "card");
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
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 360,
              height: 540,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
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
      <div className="max-w-5xl mx-auto">
        <ReviewDetail review={review} actions={actions} />
      </div>
    </div>
  );
}
