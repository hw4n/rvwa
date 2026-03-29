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
      <div className="bg-surface-low p-20 text-center border border-white/5">
        <p className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em]">Review not found</p>
      </div>
    );
  }

  const reviewTitle = getReviewExplicitTitle(review);
  const posterTitle = review.nodeTitle ?? review.proposedTitle ?? reviewTitle ?? "R";
  const posterCard = (
    <div className="relative flex aspect-[2/3] w-full max-w-44 items-center justify-center overflow-hidden border border-white/5 bg-surface-low">
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
      {!review.coverImage ? (
        <span className="relative z-10 select-none text-7xl font-black uppercase tracking-tighter text-white/10">
          {posterTitle.charAt(0)}
        </span>
      ) : null}
    </div>
  );
  const reviewContent = (
    <div className="min-w-0 space-y-4">
      {reviewTitle ? (
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-tight">
          {reviewTitle}
        </h2>
      ) : null}
      <div className="leading-relaxed font-medium text-[#c2c6d8]">
        <MarkdownPreview body={review.body} />
      </div>
    </div>
  );

  return (
    <article className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
        <div className="flex-1 max-w-4xl">
          <div className="grid items-start gap-4">
            <div className="grid gap-6 md:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] md:gap-8">
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
                <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] leading-none">
                  {new Date(review.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="text-xs font-black tracking-[0.2em] text-[#ff9b70]/90">
                  {review.author?.name ?? "익명"}
                </div>
                {review.spoiler ? (
                  <ReviewSpoilerGate className="min-w-0" title="스포일러 리뷰">
                    {reviewContent}
                  </ReviewSpoilerGate>
                ) : (
                  reviewContent
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="shrink-0 flex flex-col items-start md:items-end gap-3">
          <div className="flex flex-col items-end gap-3">
            {actions ? <div className="flex flex-wrap justify-end gap-3">{actions}</div> : null}
            <div className="flex flex-wrap gap-3">
            <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border ${
              review.status === "approved" ? "border-primary/20 text-primary/60 bg-primary/5" :
              review.status === "pending" ? "border-yellow-400/20 text-yellow-400/60 bg-yellow-400/5" :
              "border-red-400/20 text-red-400/60 bg-red-400/5"
            }`}>
              {review.status}
            </span>
            {review.spoiler && (
              <span className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border border-red-500/25 text-red-300 bg-red-500/10">
                Spoiler
              </span>
            )}
            </div>
          </div>
        </div>
      </div>
      
    </article>
  );
}
