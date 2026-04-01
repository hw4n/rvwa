import Image from "next/image";
import Link from "next/link";
import { PosterRatingBadge } from "@/components/poster-rating-badge";
import { ReviewItemTitle } from "@/components/review-item-title";
import { getPosterImageUrl } from "@/lib/poster";
import { requireViewer } from "@/lib/auth";
import { getMyReviews } from "@/lib/repository";
import { getReviewDisplayTitle } from "@/lib/review-display";

export default async function MyReviewsPage() {
  await requireViewer();
  const reviews = await getMyReviews();

  return (
    <div className="space-y-6">
      <section className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-8">
          {reviews.map((review) => (
            <div key={review.id} className="group space-y-4">
              <Link href={`/r/${review.id}`} className="block space-y-4">
                <div
                  className={`relative flex aspect-[2/3] flex-col items-center justify-center overflow-hidden border bg-surface-low p-6 transition-all group-hover:scale-[1.02] ${
                    review.spoiler
                      ? "border-[color:var(--spoiler-soft)] group-hover:border-[var(--spoiler)]/60"
                      : "border-border group-hover:border-primary/40"
                  }`}
                >
                  {review.coverImage ? (
                    <Image
                      alt={getReviewDisplayTitle(review)}
                      className="absolute inset-0 h-full w-full object-cover"
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                      src={getPosterImageUrl(review.coverImage, "card") ?? ""}
                      unoptimized
                    />
                  ) : null}
                  <div
                    className={`absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 ${
                      review.spoiler ? "bg-[var(--spoiler-surface)]" : "bg-primary/5"
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-lowest/90 via-surface-lowest/10 to-transparent" />

                  <PosterRatingBadge rating={review.rating} />

                  {!review.coverImage ? (
                    <span className="text-7xl font-black text-foreground/5 tracking-tighter uppercase mb-4 select-none group-hover:scale-110 transition-transform">
                      {(review.nodeTitle ?? review.proposedTitle ?? "R").charAt(0)}
                    </span>
                  ) : null}
                </div>

                <ReviewItemTitle
                  align="center"
                  spoiler={review.spoiler}
                  title={getReviewDisplayTitle(review)}
                  titleClassName={`line-clamp-2 text-sm transition-colors ${
                    review.spoiler ? "group-hover:text-[var(--spoiler)]" : "group-hover:text-primary"
                  }`}
                />
              </Link>
            </div>
          ))}
        </div>

        {reviews.length === 0 ? (
          <div className="bg-surface-low p-10 md:p-20 text-center border border-border">
            <p className="text-xs font-black uppercase text-foreground/20 tracking-[0.4em]">리뷰가 없습니다.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
