import { Star } from "lucide-react";
import { formatCompactRating, formatDetailedRating } from "@/lib/review-rating";

type RatingDisplaySize = "compact" | "detail";

function FilledStars({
  rating,
  size,
}: {
  rating: number;
  size: RatingDisplaySize;
}) {
  const starClassName = size === "detail" ? "size-4" : "size-3.5";

  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.max(0, Math.min(1, rating - index));

        return (
          <span className="relative block" key={index}>
            <Star className={`${starClassName} text-white/15 stroke-[1.4]`} />
            <span
              className="absolute inset-0 overflow-hidden text-primary"
              style={{ clipPath: `inset(0 ${100 - fill * 100}% 0 0)` }}
            >
              <Star className={`${starClassName} fill-current stroke-[1.4]`} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function ReviewRatingDisplay({
  rating,
  size = "compact",
}: {
  rating?: number;
  size?: RatingDisplaySize;
}) {
  if (typeof rating !== "number") {
    return null;
  }

  return (
    <div
      className={
        size === "detail"
          ? "inline-flex items-center gap-3 bg-surface-low border border-white/5 px-3 py-2 min-w-[92px] shrink-0"
          : "inline-flex items-center gap-2 bg-surface-low border border-white/5 px-2.5 py-1.5 shrink-0"
      }
    >
      <span
        className={
          size === "detail"
            ? "text-xl font-black text-primary tracking-tighter leading-none"
            : "text-lg font-black text-primary tracking-tighter leading-none"
        }
      >
        {size === "detail" ? formatDetailedRating(rating) : formatCompactRating(rating)}
      </span>
      <FilledStars rating={rating} size={size} />
    </div>
  );
}
