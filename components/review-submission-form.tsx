/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import type { Category, ContentNode, Review } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { ContentNodePicker, useContentNodePicker } from "@/components/content-node-picker";
import { ReviewRatingInput } from "@/components/review-rating-input";
import { MarkdownPreview } from "@/components/markdown-preview";
import { formatRatingInputValue } from "@/lib/review-rating";
import { getReviewExplicitTitle } from "@/lib/review-display";

export function ReviewSubmissionForm({
  categories,
  items,
  initialCategorySlug,
  initialItemSlug,
  initialReview,
}: {
  categories: Category[];
  items: ContentNode[];
  initialCategorySlug?: string;
  initialItemSlug?: string;
  initialReview?: Review | null;
}) {
  const router = useRouter();
  const submit = useMutation("reviews:submit" as any);
  const updateSubmission = useMutation("reviews:updateSubmission" as any);
  const initialItem = initialItemSlug ? items.find((item) => item.slug === initialItemSlug) : undefined;
  const [selectedItemSlug, setSelectedItemSlug] = React.useState(initialItem?.slug ?? "");
  const [search, setSearch] = React.useState(initialItem?.title ?? initialReview?.proposedTitle ?? "");
  const [proposedTitle, setProposedTitle] = React.useState(initialReview?.proposedTitle ?? "");
  const [proposedTitleTouched, setProposedTitleTouched] = React.useState(Boolean(initialReview?.proposedTitle));
  const [selectedCategorySlug, setSelectedCategorySlug] = React.useState(
    initialReview?.selectedCategorySlug ?? initialCategorySlug ?? ""
  );
  const [suggestedCategoryName, setSuggestedCategoryName] = React.useState(initialReview?.suggestedCategoryName ?? "");
  const [title, setTitle] = React.useState(initialReview?.title ?? "");
  const [body, setBody] = React.useState(initialReview?.body ?? "");
  const [rating, setRating] = React.useState(formatRatingInputValue(initialReview?.rating));
  const [spoiler, setSpoiler] = React.useState(initialReview?.spoiler ?? false);
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const selectedItem = selectedItemSlug ? items.find((item) => item.slug === selectedItemSlug) : undefined;
  const { hasNoResults, matches } = useContentNodePicker({ items, search, selectedItem });
  const effectiveProposedTitle = proposedTitle || (hasNoResults && !proposedTitleTouched ? search.trim() : "");
  const previewTitle = getReviewExplicitTitle({ title });

  async function submitReview() {
    setPending(true);
    setMessage("");

    try {
      const payload = {
        nodeId: selectedItem?.id,
        proposedTitle: selectedItem ? undefined : effectiveProposedTitle,
        selectedCategorySlug: selectedItem ? undefined : selectedCategorySlug || undefined,
        suggestedCategoryName: selectedItem ? undefined : suggestedCategoryName || undefined,
        title: title.trim(),
        body: body.trim(),
        rating: rating ? Number(rating) : undefined,
        spoiler,
      };
      const result = initialReview
        ? await updateSubmission({
          reviewId: initialReview.id,
          ...payload,
        })
        : await submit(payload);

      startTransition(() => {
        router.push(`/r/${result.reviewId}`);
      });
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "저장에 실패했습니다.");
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px] items-start min-h-0">
      <section className="space-y-4 min-h-0">
        <ContentNodePicker
          label="항목"
          matches={matches}
          onClearSelection={() => {
            setSelectedItemSlug("");
            setSearch("");
            if (!proposedTitleTouched) {
              setProposedTitle("");
            }
          }}
          onSearchChange={(value) => {
            setSearch(value);
            if (!proposedTitleTouched) {
              setProposedTitle("");
            }
          }}
          onSelect={(item) => {
            setSelectedItemSlug(item.slug);
            setSearch(item.title);
          }}
          required
          search={search}
          selectedItem={selectedItem}
        />

        {selectedItem ? null : (
          <div className="grid gap-4 p-4 bg-surface-low border border-white/5">
            <p className="text-sm font-black text-primary tracking-[0.3em] uppercase">새 항목 제안</p>
            <p className="text-xs text-muted-foreground/70">
              카테고리 및 제목은 관리자가 최종 검토 및 분류하므로 간단히 작성해 주세요.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-white/30 tracking-widest">카테고리</label>
                <select
                  className="w-full border border-white/5 bg-surface-high px-4 py-3 text-sm font-bold text-white focus:border-primary/40 appearance-none"
                  onChange={(event) => {
                    const next = event.currentTarget.value;
                    setSelectedCategorySlug(next);
                    if (next) {
                      setSuggestedCategoryName("");
                    }
                  }}
                  value={selectedCategorySlug}
                >
                  <option value="">카테고리 선택...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-white/30 tracking-widest">
                  항목 제목
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  className="w-full bg-surface-high border border-white/5 px-4 py-3 text-base font-bold text-white focus:border-primary/40"
                  onChange={(event) => {
                    setProposedTitleTouched(true);
                    setProposedTitle(event.currentTarget.value);
                  }}
                  placeholder="예: 케이온 1기"
                  value={effectiveProposedTitle}
                />
              </div>
              {!selectedCategorySlug ? (
                <div className="space-y-3 md:col-span-2">
                  <label className="text-xs font-black uppercase text-white/30 tracking-widest">새 카테고리</label>
                  <input
                    className="w-full bg-surface-high border border-white/5 px-4 py-3 text-base font-bold text-white focus:border-primary/40"
                    onChange={(event) => setSuggestedCategoryName(event.currentTarget.value)}
                    placeholder="새 카테고리 이름 (예: 애니메이션, 게임...)"
                    value={suggestedCategoryName}
                  />
                </div>
              ) : null}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm font-black text-primary tracking-[0.3em] uppercase">리뷰 세부</p>
            <input
              className="w-full bg-transparent border-b border-white/5 px-0 py-2 text-xl font-black tracking-tight text-white focus:border-primary/40 transition-colors placeholder:text-white/10"
              onChange={(event) => setTitle(event.currentTarget.value)}
              placeholder="리뷰 제목 (선택)"
              value={title}
            />
          </div>

          <div className="space-y-4">
            <p className="text-sm font-black text-primary tracking-[0.3em] uppercase">
              리뷰 내용
              <span className="ml-1 text-red-500">*</span>
            </p>
            <textarea
              className="min-h-[260px] w-full bg-surface-low border border-white/5 p-4 text-base leading-relaxed text-[#c2c6d8] focus:border-primary/20 transition-all placeholder:text-white/5"
              onChange={(event) => setBody(event.currentTarget.value)}
              placeholder="리뷰 내용을 입력하세요."
              value={body}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-[160px_1fr] items-end">
            <div className="space-y-4">
              <p className="text-sm font-black text-primary tracking-[0.3em] uppercase">점수</p>
              <ReviewRatingInput onChange={setRating} value={rating} />
            </div>
            <div />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <label className="inline-flex items-center gap-3 cursor-pointer group">
            <div
              className={`w-4 h-4 border-2 transition-all flex items-center justify-center ${spoiler ? "bg-primary border-primary" : "border-white/10 group-hover:border-primary/40"}`}
            >
              {spoiler && <div className="w-2 h-2 bg-black rounded-none" />}
            </div>
            <input checked={spoiler} className="hidden" onChange={(event) => setSpoiler(event.currentTarget.checked)} type="checkbox" />
            <span className="text-sm font-black uppercase tracking-[0.15em] text-white/80 group-hover:text-white transition-colors">스포일러 포함</span>
          </label>
          <Button
            className="rounded-none bg-primary text-black hover:bg-primary/80"
            disabled={!body.trim() || pending}
            onClick={() => void submitReview()}
            type="button"
          >
            {initialReview ? "리뷰 수정" : "리뷰 작성"}
          </Button>
          {message ? <p className="text-xs font-black uppercase tracking-widest text-red-400">{message}</p> : null}
        </div>
      </section>

      <aside className="space-y-6">
        <div className="bg-surface-lowest p-6 border border-white/5">
          <p className="text-sm font-black text-primary tracking-[0.3em] uppercase mb-4">미리보기</p>
          {previewTitle ? (
            <h2 className="text-2xl font-black tracking-tight text-white uppercase leading-tight mb-4">
              {previewTitle}
            </h2>
          ) : null}
          <div className="text-sm text-[#c2c6d8]/40 prose prose-invert prose-sm max-w-none leading-relaxed">
            <MarkdownPreview body={body.trim() || "_미리보기 준비중..._"} />
          </div>
        </div>
      </aside>
    </div>
  );
}
