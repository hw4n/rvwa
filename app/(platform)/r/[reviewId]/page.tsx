import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewDeleteButton } from "@/components/review-delete-button";
import { ReviewRejectButton } from "@/components/review-reject-button";
import { Button } from "@/components/ui/button";
import { ReviewDetail } from "@/components/review-detail";
import { getViewer } from "@/lib/auth";
import { getReviewById } from "@/lib/repository";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  const [review, viewer] = await Promise.all([getReviewById(reviewId), getViewer()]);

  if (!review) {
    notFound();
  }

  const isOwner = viewer?.id === review.author?.id;
  const isAdmin = viewer?.role === "admin";

  const actions = (isOwner || isAdmin) ? (
    <div className="flex flex-wrap gap-3">
      {isOwner ? (
        <Button
          className="rounded-none uppercase tracking-[0.15em] text-black"
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
