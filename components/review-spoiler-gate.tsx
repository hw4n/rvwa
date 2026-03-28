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
    <div className={`border border-red-500/20 bg-[#180f0f]/95 text-center shadow-2xl ${isCompact ? "p-4" : "p-6"} ${className ?? ""}`}>
      <div className="flex justify-center">
        <span className={`flex items-center justify-center border border-red-500/30 bg-red-500/10 text-red-300 font-black ${isCompact ? "size-10 text-lg" : "size-12 text-xl"}`}>
          !
        </span>
      </div>
      <p className={`mt-3 font-black uppercase tracking-[0.2em] text-red-300 ${isCompact ? "text-[11px]" : "text-xs"}`}>
        {title}
      </p>
      <p className={`mt-2 leading-relaxed text-[#f0d4d4]/70 ${isCompact ? "text-xs" : "text-sm"}`}>
        {description ?? "이 리뷰에는 핵심 내용을 드러내는 스포일러가 포함되어 있습니다."}
      </p>
      <Button
        className="mt-4 w-full rounded-none border-red-400/25 bg-red-400/12 text-red-50 hover:bg-red-400/22"
        onClick={() => setRevealed(true)}
        type="button"
        variant="outline"
      >
        {confirmLabel}
      </Button>
    </div>
  );
}
