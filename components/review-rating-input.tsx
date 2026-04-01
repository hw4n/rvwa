"use client";

import * as React from "react";
import { Star, X } from "lucide-react";
import {
  formatDetailedRating,
  reviewRatingMax,
  reviewRatingMin,
  reviewRatingStep,
} from "@/lib/review-rating";

function clampRating(value: number) {
  return Math.min(reviewRatingMax, Math.max(reviewRatingMin, value));
}

function normalizeDraftValue(raw: string) {
  if (!raw.trim()) {
    return "";
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return "";
  }

  return formatDetailedRating(clampRating(parsed));
}

function parseRatingValue(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function StarButton({
  index,
  rating,
  onSelect,
}: {
  index: number;
  rating: number;
  onSelect: (value: number) => void;
}) {
  const fill = Math.max(0, Math.min(1, rating - (index - 1)));

  return (
    <button
      className="relative size-8 shrink-0 text-foreground/15 transition-colors hover:text-primary/40"
      onClick={() => onSelect(index)}
      type="button"
    >
      <Star className="absolute inset-0 size-8 stroke-[1.4]" />
      <span
        className="absolute inset-0 overflow-hidden text-primary"
        style={{ clipPath: `inset(0 ${100 - fill * 100}% 0 0)` }}
      >
        <Star className="size-8 fill-current stroke-[1.4]" />
      </span>
      <span className="sr-only">{index}점</span>
    </button>
  );
}

export function ReviewRatingInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const numericValue = parseRatingValue(value) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative inline-flex">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }, (_, index) => (
              <StarButton
                index={index + 1}
                key={index}
                onSelect={(nextValue) => onChange(String(nextValue))}
                rating={numericValue}
              />
            ))}
          </div>

          <input
            className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none opacity-0"
            max={reviewRatingMax}
            min={reviewRatingMin}
            onChange={(event) =>
              onChange(formatDetailedRating(Number(event.currentTarget.value)))
            }
            step={reviewRatingStep}
            type="range"
            value={numericValue}
          />
        </div>

        <div className="relative min-w-[128px]">
          <input
            className="w-full bg-surface-low border border-border px-3 py-2 pr-8 text-base font-black tracking-tight text-foreground focus:border-primary/40 transition-all placeholder:text-foreground/10"
            inputMode="decimal"
            max="5"
            min="0"
            onBlur={(event) => onChange(normalizeDraftValue(event.currentTarget.value))}
            onChange={(event) => {
              const nextValue = event.currentTarget.value;
              if (!nextValue || /^\d*(\.\d{0,3})?$/.test(nextValue)) {
                onChange(nextValue);
              }
            }}
            placeholder="0.000"
            step="0.001"
            value={value}
          />
          <button
            className={`absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 transition-opacity ${value ? "opacity-100" : "opacity-0 pointer-events-none"} hover:text-foreground`}
            onClick={() => onChange("")}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
