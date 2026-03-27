import type { ReactNode } from "react";
import type { Review } from "@/lib/domain";
import { MarkdownPreview } from "@/components/markdown-preview";
import { ReviewRatingDisplay } from "@/components/review-rating-display";
import { getReviewExplicitTitle } from "@/lib/review-display";

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

  return (
    <article className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
        <div className="flex-1 max-w-4xl">
          <div className="grid items-start gap-4">
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4">
            <ReviewRatingDisplay rating={review.rating} size="detail" />
              <div className="min-w-0 space-y-4">
                <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] leading-none">
                  {new Date(review.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                {reviewTitle ? (
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-tight">
                    {reviewTitle}
                  </h2>
                ) : null}
                <div className="leading-relaxed font-medium text-[#c2c6d8]">
                  <MarkdownPreview body={review.body} />
                </div>
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
              <span className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border border-red-400/20 text-red-400/60 bg-red-400/5">
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
