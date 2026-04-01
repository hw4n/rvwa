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
  const starClassName = size === "detail" ? "size-3.5" : "size-3.5";
  const containerClassName = size === "detail" ? "flex items-center gap-1" : "flex items-center gap-1.5";

  return (
    <div className={containerClassName}>
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.max(0, Math.min(1, rating - index));

        return (
          <span className="relative block" key={index}>
            <Star className={`${starClassName} text-foreground/15 stroke-[1.4]`} />
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
          ? "flex w-full items-center justify-between gap-2 border border-border bg-surface-low px-2.5 py-2 shrink-0"
          : "inline-flex items-center gap-2 bg-surface-low border border-border px-2.5 py-1.5 shrink-0"
      }
    >
      <span
        className={
          size === "detail"
            ? "text-lg font-black text-primary tracking-tight leading-none"
            : "text-lg font-black text-primary tracking-tighter leading-none"
        }
      >
        {size === "detail" ? formatDetailedRating(rating) : formatCompactRating(rating)}
      </span>
      <FilledStars rating={rating} size={size} />
    </div>
  );
}
