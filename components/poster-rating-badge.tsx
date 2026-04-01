import { formatCompactRating } from "@/lib/review-rating";

export function PosterRatingBadge({
  rating,
}: {
  rating?: number;
}) {
  if (typeof rating !== "number") {
    return null;
  }

  return (
    <div className="absolute top-0 right-0 px-3 py-2 bg-surface-lowest border-b border-l border-border flex items-center justify-center z-10 group-hover:border-primary/40 transition-colors">
      <span className="text-[11px] font-black text-foreground">{formatCompactRating(rating)}</span>
    </div>
  );
}
