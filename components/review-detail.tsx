import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Review } from "@/lib/domain";
import { MarkdownPreview } from "@/components/markdown-preview";
import { ReviewRatingDisplay } from "@/components/review-rating-display";
import { getPosterImageUrl } from "@/lib/poster";
import { getReviewExplicitTitle } from "@/lib/review-display";
import { ReviewSpoilerGate } from "@/components/review-spoiler-gate";

export function ReviewDetail({
  review,
  actions,
}: {
  review: Review | null;
  actions?: ReactNode;
}) {
  if (!review) {
    return (
      <div className="bg-surface-low p-20 text-center border border-border">
        <p className="text-[10px] font-black uppercase text-foreground/20 tracking-[0.4em]">Review not found</p>
      </div>
    );
  }

  const reviewTitle = getReviewExplicitTitle(review);
  const posterTitle = review.nodeTitle ?? review.proposedTitle ?? reviewTitle ?? "R";
  const statusBadges = (
    <div className="flex flex-wrap gap-3">
      <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border ${
        review.status === "approved" ? "border-primary/20 text-primary/60 bg-primary/5" :
        review.status === "pending" ? "border-yellow-400/20 text-yellow-400/60 bg-yellow-400/5" :
        "border-red-400/20 text-red-400/60 bg-red-400/5"
      }`}>
        {review.status}
      </span>
      {review.spoiler ? (
        <span className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border border-[color:var(--spoiler-soft)] bg-[var(--spoiler-surface)] text-[var(--spoiler)]">
          Spoiler
        </span>
      ) : null}
    </div>
  );
  const reviewMeta = (
    <>
      <div className="text-foreground/40 text-[10px] font-black uppercase tracking-[0.16em] leading-none sm:tracking-[0.2em]">
        {new Date(review.createdAt).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>
      <div className="text-xs font-black tracking-[0.16em] text-tertiary/90 sm:tracking-[0.2em]">
        {review.author?.name ?? "익명"}
      </div>
    </>
  );
  const topControls = (
    <div className="min-w-0 space-y-4 md:flex md:flex-col md:items-end">
      {actions ? (
        <div className="flex flex-wrap gap-3 md:justify-end">
          {actions}
        </div>
      ) : null}
      {statusBadges}
    </div>
  );
  const posterCard = (
    <div className="relative flex aspect-[2/3] w-full max-w-44 items-center justify-center overflow-hidden border border-border bg-surface-low">
      {review.coverImage ? (
        <Image
          alt={posterTitle}
          className="absolute inset-0 h-full w-full object-cover"
          fill
          priority
          sizes="(max-width: 768px) 10rem, 11rem"
          src={getPosterImageUrl(review.coverImage, "detail") ?? ""}
          unoptimized
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-surface-lowest/90 via-surface-lowest/10 to-transparent" />
      {!review.coverImage ? (
        <span className="relative z-10 select-none text-7xl font-black uppercase tracking-tighter text-foreground/10">
          {posterTitle.charAt(0)}
        </span>
      ) : null}
    </div>
  );
  const reviewBody = (
    <div className="min-w-0 space-y-4">
      {reviewTitle ? (
        <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-tight sm:text-4xl">
          {reviewTitle}
        </h2>
      ) : null}
      <div className="leading-relaxed font-medium text-muted-foreground">
        <MarkdownPreview body={review.body} />
      </div>
    </div>
  );
  const renderReviewContent = (content: ReactNode) => review.spoiler ? (
    <ReviewSpoilerGate
      className="min-w-0"
      confirmLabel="스포일러가 담긴 내용 확인"
      hideLabel="스포일러가 담긴 내용 숨기기"
      variant="toggle"
    >
      {content}
    </ReviewSpoilerGate>
  ) : (
    content
  );
  return (
    <article className="space-y-8">
      <div className="grid gap-8 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-6 xl:hidden">
        <div className="w-full max-w-44 space-y-4">
          {review.nodeSlug ? (
            <Link className="block w-full max-w-44 transition-transform hover:scale-[1.02]" href={`/n/${review.nodeSlug}`}>
              {posterCard}
            </Link>
          ) : (
            posterCard
          )}
          <ReviewRatingDisplay rating={review.rating} size="detail" />
        </div>
        {topControls}
        <div className="min-w-0 space-y-4 md:col-span-2">
          {reviewMeta}
          {renderReviewContent(reviewBody)}
        </div>
      </div>
      <div className="hidden items-start justify-between gap-8 xl:flex">
        <div className="max-w-4xl flex-1">
          <div className="grid items-start gap-4">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]">
              <div className="flex w-full max-w-44 flex-col items-start gap-4">
                {review.nodeSlug ? (
                  <Link className="block w-full max-w-44 transition-transform hover:scale-[1.02]" href={`/n/${review.nodeSlug}`}>
                    {posterCard}
                  </Link>
                ) : (
                  posterCard
                )}
                <ReviewRatingDisplay rating={review.rating} size="detail" />
              </div>
              <div className="min-w-0 space-y-4">
                {reviewMeta}
                {renderReviewContent(reviewBody)}
              </div>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-3 xl:items-end">
          {actions ? (
            <div className="flex flex-wrap justify-end gap-3">
              {actions}
            </div>
          ) : null}
          {statusBadges}
        </div>
      </div>
    </article>
  );
}
