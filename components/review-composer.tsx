/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import * as React from "react";
import { startTransition, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import type { ContentNode, ReviewDraft } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { MarkdownPreview } from "@/components/markdown-preview";
import { getReviewDisplayTitle } from "@/lib/review-display";

export const reviewBodyTemplate = `내가 이 작품을 보고 느낀것은
- 주인공이 멋지고
- 주인공이 예쁘고
- 주인공이 대단하다는 점으로

그래서 나는 앞으로 ...

0. 대단해야되고
0. 멋져야되고`;

const initialDraft: ReviewDraft = {
  title: "",
  body: reviewBodyTemplate,
  rating: "",
  spoiler: false,
};

function resolveDraft(draft?: ReviewDraft | null): ReviewDraft {
  return {
    ...initialDraft,
    ...(draft ?? {}),
    title: draft?.title || "",
  };
}

export function ReviewComposer({
  node,
  initialDraft,
}: {
  node: ContentNode;
  initialDraft?: ReviewDraft | null;
}) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<ReviewDraft>(() => resolveDraft(initialDraft));
  const [message, setMessage] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const deferredBody = useDeferredValue(draft.body);
  const saveDraft = useMutation("reviews:upsertDraft" as any);
  const publish = useMutation("reviews:publish" as any);
  const discardDraft = useMutation("reviews:discardDraft" as any);

  React.useEffect(() => {
    setDraft(resolveDraft(initialDraft));
  }, [initialDraft, node.id]);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      void saveDraft({
        nodeId: node.id,
        title: draft.title,
        body: draft.body,
        rating: draft.rating ? Number(draft.rating) : undefined,
        spoiler: draft.spoiler,
      });
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [draft, node.id, saveDraft]);

  function updateDraft<K extends keyof ReviewDraft>(key: K, value: ReviewDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function publishReview() {
    setPending(true);
    setMessage("");
    try {
      const result = await publish({
        nodeId: node.id,
        title: draft.title?.trim() || undefined,
        body: draft.body.trim(),
        rating: draft.rating ? Number(draft.rating) : undefined,
        spoiler: draft.spoiler,
      });
      startTransition(() => {
        router.push(`/r/${result.reviewId}`);
      });
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "저장에 실패했습니다.");
      setPending(false);
    }
  }

  return (
    <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_400px]">
      <section className="bg-surface-low p-10 border-l-2 border-primary/50 shadow-2xl relative">
        <div className="flex flex-wrap items-center justify-between gap-6 border-b border-border pb-8">
          <div>
            <p className="text-sm font-bold text-primary/60 uppercase tracking-widest mb-2 font-mono italic">REVIEW_PROTOCOL</p>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">매트릭스 데이터 전송</h2>
            <p className="mt-4 max-w-2xl text-sm font-bold leading-relaxed text-muted-foreground/40 uppercase tracking-widest">
              노드 계층 구조로의 직접 매핑. 저장소: 서버 레이어.
            </p>
          </div>
          <div className="bg-primary/5 border border-primary/20 px-3 py-1 text-sm font-black uppercase text-primary font-mono italic">
            0X42_PENDING_REVIEW
          </div>
        </div>

        <div className="mt-10 space-y-10">
          <div className="space-y-4">
            <span className="text-xs font-bold text-muted-foreground/30 uppercase tracking-widest">리뷰 제목 인덱스</span>
            <input
              className="w-full bg-surface-lowest border border-border px-6 py-4 text-xl font-black italic tracking-tight text-foreground focus:border-primary/50 transition-colors"
              value={draft.title}
              onChange={(event) => updateDraft("title", event.target.value)}
              placeholder="ENTRY_TITLE_NULL"
            />
          </div>

          <div className="grid gap-10 md:grid-cols-[200px_1fr]">
            <div className="space-y-4">
              <span className="text-xs font-bold text-muted-foreground/30 uppercase tracking-widest">평점 (0-100)</span>
              <input
                className="w-full bg-surface-lowest border border-border px-6 py-4 text-4xl font-black italic tracking-tighter text-tertiary focus:border-[#ffb599]/40 transition-colors"
                inputMode="decimal"
                max="100"
                min="0"
                step="1"
                value={draft.rating}
                onChange={(event) => updateDraft("rating", event.target.value)}
                placeholder="00"
              />
            </div>
            <label className="flex items-center gap-5 border border-border bg-surface-lowest px-8 py-4 cursor-pointer hover:bg-foreground/5 transition-colors group">
              <input
                checked={draft.spoiler}
                className="size-5 border-border bg-black text-primary focus:ring-0"
                onChange={(event) => updateDraft("spoiler", event.target.checked)}
                type="checkbox"
              />
              <span className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 group-hover:text-primary transition-colors">중대한 스포일러 포함 아티팩트로 표시</span>
            </label>
          </div>

          <div className="space-y-4">
            <span className="text-xs font-bold text-muted-foreground/30 uppercase tracking-widest">데이터 스트림 (Markdown)</span>
            <textarea
              className="min-h-[500px] w-full bg-surface-lowest border border-border p-6 font-mono text-[13px] leading-relaxed text-muted-foreground placeholder:opacity-20 italic focus:border-primary/30 transition-colors"
              value={draft.body}
              onChange={(event) => updateDraft("body", event.target.value)}
              placeholder={reviewBodyTemplate}
            />
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-4 border-t border-border pt-10">
          <Button
            onClick={() => void publishReview()}
            disabled={!draft.body.trim() || pending}
            className="rounded-none uppercase tracking-widest font-bold"
          >            매트릭스 커밋
          </Button>
          <Button asChild variant="outline" className="rounded-none border-border text-muted-foreground hover:bg-foreground/5 uppercase">
            <Link href={`/n/${node.slug}`}>중단 / 복귀</Link>
          </Button>
          <Button
            onClick={() => {
              if(confirm("전송 버퍼를 비우시겠습니까?")) {
                void discardDraft({ nodeId: node.id });
                setDraft(resolveDraft());
                setMessage("초안을 비웠습니다.");
              }
            }}
            variant="ghost"
            className="rounded-none text-red-400/60 hover:text-red-400 hover:bg-red-400/5 uppercase ml-auto"
          >
            초안 파기
          </Button>
        </div>

        {message ? <p className="mt-8 text-sm font-mono font-bold uppercase tracking-widest text-primary/40 italic">{message}</p> : null}
      </section>

      <aside className="space-y-6">
        <div className="bg-surface-low p-8 border border-border shadow-2xl">
          <p className="text-sm font-bold text-primary/40 uppercase tracking-widest mb-6 font-mono italic">REAL_TIME_PREVIEW</p>
          <h2 className="text-xl font-black italic tracking-tighter text-foreground uppercase border-b border-border pb-6 truncate leading-none">
            {getReviewDisplayTitle({
              title: draft.title,
              body: draft.body,
              nodeTitle: node.title,
            })}
          </h2>
          <div className="mt-8 text-sm text-muted-foreground/70">
            <MarkdownPreview body={deferredBody || "_버퍼가 비어 있습니다. 입력을 시작하십시오._"} />
          </div>
        </div>
        
        <div className="bg-primary/5 p-6 border-l-2 border-primary italic">
          <p className="text-sm text-primary/60 leading-relaxed font-bold uppercase tracking-widest">
             노드 <span className="text-foreground font-bold underline underline-offset-4 decoration-primary/40">{node.title}</span> 에 대한 리뷰를 작성 중입니다. 
             전송된 데이터는 아카이브의 일부가 됩니다.
          </p>
        </div>
      </aside>
    </div>
  );
}
