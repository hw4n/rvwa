import Image from "next/image";
import Link from "next/link";
import { PosterRatingBadge } from "@/components/poster-rating-badge";
import { PlatformHeader } from "@/components/platform-header";
import { getPosterImageUrl } from "@/lib/poster";
import { getDashboardSnapshot } from "@/lib/repository";
import { getReviewDisplayTitle } from "@/lib/review-display";

export default async function DashboardPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <div className="space-y-10 md:space-y-20">
      <PlatformHeader
        eyebrow=""
        title=""
        crumbs={[{ label: "대시보드" }]}
        variant="compact"
      />

      <section className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-8">
          {snapshot.recentReviews.map((review) => (
            <Link
              key={review.id}
              href={`/r/${review.id}`}
              className="group space-y-4"
            >
              <div className="aspect-[2/3] bg-surface-low border border-white/5 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-all group-hover:scale-[1.02] group-hover:border-primary/40">
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
                 <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
                 
                 {/* Rating Orbit in Dashboard Poster */}
                 <PosterRatingBadge rating={review.rating} />

                 {!review.coverImage ? (
                   <span className="text-7xl font-black text-white/5 tracking-tighter uppercase mb-4 select-none group-hover:scale-110 transition-transform">
                     {(review.nodeTitle ?? review.proposedTitle ?? "R").charAt(0)}
                   </span>
                 ) : null}
                 
                 <div className="relative z-10 mt-auto flex flex-col items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                   <div className="w-6 h-px bg-primary/20" />
                 </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-black text-white tracking-tight group-hover:text-primary transition-colors line-clamp-2 text-center leading-tight">
                  {getReviewDisplayTitle(review)}
                </h3>
              </div>
            </Link>
          ))}
        </div>
        
        {snapshot.recentReviews.length === 0 ? (
          <div className="bg-surface-low p-10 md:p-20 text-center border border-white/5">
            <p className="text-xs font-black uppercase text-white/20 tracking-[0.4em]">승인된 리뷰가 아직 없습니다.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
