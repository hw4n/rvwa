"use client";

import { ScrollTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

const CHANGELOG_ENTRIES = [
  {
    date: "2026.04.19",
    title: "좀 더 커뮤니티fy 하기",
    summary:
      "추천과 댓글 시스템을 추가합니다. 로고는 심심해서 바꿉니다",
  },
  {
    date: "2026.04.17",
    title: "제작사, [방영/출시/등장...] 시기 탭",
    summary:
      "유의미한 그룹으로 등록된 항목들을 나열할 수 있는 기능을 추가.",
  },
  {
    date: "2026.04.07",
    title: "디스코드 임베드 지원",
    summary:
      "디스코드에 링크를 붙여넣으면 예쁘게 표시되는 기능을 추가했습니다. 또한 지금 보고 계신 업데이트 로그가 추가되었습니다.",
  },
  {
    date: "2026.03.29",
    title: "서비스 시작",
    summary:
      "아무 주제에 대해서나 리뷰를 기록할 수 있는 서비스를 시작했습니다.",
  }
] as const;

export function ChangelogPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="border-border bg-surface-lowest/80 text-foreground hover:bg-surface-high"
          size="icon-sm"
          variant="outline"
        >
          <ScrollTextIcon className="size-4" />
          <span className="sr-only">변경 기록 열기</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 border-border bg-surface-low p-0 shadow-2xl"
      >
        <div className="custom-scrollbar max-h-80 space-y-3 overflow-y-auto p-4">
          {CHANGELOG_ENTRIES.map((entry, index) => (
            <div className="space-y-3" key={`${entry.date}-${entry.title}`}>
              <article className="group relative flex flex-col gap-1">
                <time className="text-[10px] font-medium text-muted-foreground/60">
                  {entry.date}
                </time>
                <h3 className="text-sm font-semibold text-foreground">
                  {entry.title}
                </h3>
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  {entry.summary}
                </p>
              </article>
              {index < CHANGELOG_ENTRIES.length - 1 ? (
                <Separator className="bg-border/50" />
              ) : null}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
