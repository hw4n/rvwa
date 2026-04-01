"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export function ReviewSpoilerGate({
  children,
  className,
  confirmLabel = "확인하고 읽기",
  description,
  title = "스포일러 경고",
  variant = "detail",
}: {
  children: React.ReactNode;
  className?: string;
  confirmLabel?: string;
  description?: string;
  title?: string;
  variant?: "compact" | "detail";
}) {
  const [revealed, setRevealed] = React.useState(false);

  if (revealed) {
    return <>{children}</>;
  }

  const isCompact = variant === "compact";

  return (
    <div
      className={`border border-[color:var(--spoiler-soft)] bg-[var(--spoiler-panel)] text-center shadow-2xl ${isCompact ? "p-4" : "p-6"} ${className ?? ""}`}
    >
      <div className="flex justify-center">
        <span
          className={`flex items-center justify-center border border-[color:var(--spoiler-soft)] bg-[var(--spoiler-surface)] text-[var(--spoiler)] font-black ${isCompact ? "size-10 text-lg" : "size-12 text-xl"}`}
        >
          !
        </span>
      </div>
      <p className={`mt-3 font-black uppercase tracking-[0.2em] text-[var(--spoiler)] ${isCompact ? "text-[11px]" : "text-xs"}`}>
        {title}
      </p>
      <p className={`mt-2 leading-relaxed text-foreground/72 ${isCompact ? "text-xs" : "text-sm"}`}>
        {description ?? "이 리뷰에는 핵심 내용을 드러내는 스포일러가 포함되어 있습니다."}
      </p>
      <Button
        className="mt-4 w-full rounded-none border-[color:var(--spoiler-soft)] bg-[var(--spoiler)] text-[var(--spoiler-foreground)] hover:bg-[color:color-mix(in_srgb,var(--spoiler)_88%,black)]"
        onClick={() => setRevealed(true)}
        type="button"
        variant="outline"
      >
        {confirmLabel}
      </Button>
    </div>
  );
}
