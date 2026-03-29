/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import type { Category, ContentNode, MetadataFieldType, Review } from "@/lib/domain";
import { ContentNodePicker, useContentNodePicker } from "@/components/content-node-picker";
import { PosterUploadField } from "@/components/poster-upload-field";
import { ReviewDeleteButton } from "@/components/review-delete-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  formatMetadataValueForInput,
  isValidMetadataKeyInput,
  metadataFieldTypeOptions,
  normalizeMetadataKey,
  parseMetadataValue,
} from "@/lib/metadata";
import { formatCompactRating } from "@/lib/review-rating";
import { getReviewDisplayTitle } from "@/lib/review-display";
import { ReviewSpoilerGate } from "@/components/review-spoiler-gate";
import { isValidCategorySlugInput, isValidItemSlugInput, normalizeSearchSlug } from "@/lib/slug";

type EditableMetadataRow = {
  id: string;
  key: string;
  type: MetadataFieldType;
  value: string | boolean;
};

function createEmptyMetadataRow(): EditableMetadataRow {
  return {
    id: Math.random().toString(36).slice(2),
    key: "",
    type: "text",
    value: "",
  };
}

function formatReviewDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.valueOf())) {
    return "-";
  }

  return parsed.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function MetadataValueInput({
  type,
  value,
  onChange,
}: {
  type: MetadataFieldType;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
}) {
  if (type === "boolean") {
    return (
      <div className="flex h-12 items-center justify-between border border-white/5 bg-[#0e0e0e] px-4">
        <span className="text-sm font-bold text-white">{value ? "true" : "false"}</span>
        <Switch checked={Boolean(value)} onCheckedChange={onChange} />
      </div>
    );
  }

  return (
    <Input
      className="h-12 rounded-none border-white/5 bg-[#0e0e0e] px-4 text-white"
      onChange={(event) => onChange(event.currentTarget.value)}
      placeholder={type === "list" ? "a, b, c" : type}
      value={String(value)}
    />
  );
}

export function ReviewModerationList() {
  const reviews = (useQuery("reviews:listPending" as any) as Review[] | undefined) ?? [];
  const categories = (useQuery("categories:list" as any) as Category[] | undefined) ?? [];
  const items = (useQuery("nodes:listIndex" as any) as ContentNode[] | undefined) ?? [];
  const resolveAndApprove = useMutation("reviews:resolveAndApprove" as any);
  const reject = useMutation("reviews:reject" as any);

  const [openReviewId, setOpenReviewId] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [searches, setSearches] = React.useState<Record<string, string>>({});
  const [selectedItemIds, setSelectedItemIds] = React.useState<Record<string, string>>({});
  const [categorySlugs, setCategorySlugs] = React.useState<Record<string, string>>({});
  const [newCategoryNames, setNewCategoryNames] = React.useState<Record<string, string>>({});
  const [newCategorySlugs, setNewCategorySlugs] = React.useState<Record<string, string>>({});
  const [newItemTitles, setNewItemTitles] = React.useState<Record<string, string>>({});
  const [newItemSummaries, setNewItemSummaries] = React.useState<Record<string, string>>({});
  const [newItemSlugs, setNewItemSlugs] = React.useState<Record<string, string>>({});
  const [newItemSlugOverrides, setNewItemSlugOverrides] = React.useState<Record<string, boolean>>({});
  const [coverImages, setCoverImages] = React.useState<Record<string, string>>({});
  const [definedValuesByReview, setDefinedValuesByReview] = React.useState<
    Record<string, Record<string, string | boolean>>
  >({});
  const [customRowsByReview, setCustomRowsByReview] = React.useState<
    Record<string, EditableMetadataRow[]>
  >({});
  const [messages, setMessages] = React.useState<Record<string, string>>({});

  const activeReview = reviews.find((review) => review.id === openReviewId) ?? null;
  const selectedItemId = activeReview
    ? selectedItemIds[activeReview.id] ?? activeReview.nodeId ?? ""
    : "";
  const selectedItem = activeReview && selectedItemId ? items.find((item) => item.id === selectedItemId) : undefined;
  const search = activeReview ? searches[activeReview.id] ?? "" : "";
  const { matches } = useContentNodePicker({ items, search, selectedItem });
  const activeCategorySlug =
    selectedItem?.categorySlug ??
    (activeReview ? categorySlugs[activeReview.id] ?? activeReview.selectedCategorySlug ?? "" : "");
  const activeNewCategoryName = activeReview
    ? newCategoryNames[activeReview.id] ?? activeReview.suggestedCategoryName ?? ""
    : "";
  const activeNewCategorySlug = activeReview ? newCategorySlugs[activeReview.id] ?? "" : "";
  const activeNewItemTitle = activeReview
    ? newItemTitles[activeReview.id] ?? activeReview.proposedTitle ?? activeReview.nodeTitle ?? ""
    : "";
  const activeNewItemSummary = activeReview ? newItemSummaries[activeReview.id] ?? "" : "";
  const activeAutoNewItemSlug = normalizeSearchSlug(activeNewItemTitle);
  const activeHasManualNewItemSlug = activeReview ? newItemSlugOverrides[activeReview.id] ?? false : false;
  const activeNewItemSlug = activeReview
    ? activeHasManualNewItemSlug
      ? newItemSlugs[activeReview.id] ?? ""
      : activeAutoNewItemSlug
    : "";
  const activeCoverImage = activeReview ? coverImages[activeReview.id] ?? "" : "";
  const activeCategory = categories.find((category) => category.slug === activeCategorySlug);
  const activeDefinedValues = activeReview ? definedValuesByReview[activeReview.id] ?? {} : {};
  const activeCustomRows = activeReview ? customRowsByReview[activeReview.id] ?? [] : [];
  const message = activeReview ? messages[activeReview.id] : "";

  if (!reviews.length) {
    return <div className="text-sm text-[#8c90a1]">승인 대기 중인 리뷰가 없습니다.</div>;
  }

  function getAttributes(reviewId: string, category: Category | undefined) {
    const nextAttributes: Record<string, string | number | boolean | string[]> = {};
    const seenKeys = new Set<string>();
    const definedValues = definedValuesByReview[reviewId] ?? {};
    const customRows = customRowsByReview[reviewId] ?? [];

    for (const field of category?.fieldDefinitions ?? []) {
      const parsed = parseMetadataValue(field.type, definedValues[field.key] ?? "");
      if (parsed !== undefined) {
        nextAttributes[field.key] = parsed;
      }
      seenKeys.add(field.key);
    }

    for (const row of customRows) {
      const hasContent = row.key.trim() || String(row.value).trim();
      if (!hasContent) {
        continue;
      }

      if (!isValidMetadataKeyInput(row.key)) {
        throw new Error("추가 메타데이터 key는 영문, 숫자, 공백, 하이픈만 사용할 수 있습니다.");
      }

      const key = normalizeMetadataKey(row.key);
      if (!key) {
        throw new Error("추가 메타데이터 key를 입력하세요.");
      }

      if (seenKeys.has(key)) {
        throw new Error(`중복된 메타데이터 key: ${key}`);
      }

      const parsed = parseMetadataValue(row.type, row.value);
      if (parsed !== undefined) {
        nextAttributes[key] = parsed;
      }
      seenKeys.add(key);
    }

    return nextAttributes;
  }

  async function handleApprove() {
    if (!activeReview) return;

    setPendingId(activeReview.id);
    setMessages((current) => ({ ...current, [activeReview.id]: "" }));

    if (!selectedItem && !isValidCategorySlugInput(activeNewCategorySlug || "")) {
      setMessages((current) => ({
        ...current,
        [activeReview.id]: "카테고리 slug는 문자, 숫자, 공백, 하이픈만 사용할 수 있습니다.",
      }));
      setPendingId(null);
      return;
    }

    if (!selectedItem && !isValidItemSlugInput(activeNewItemSlug || "")) {
      setMessages((current) => ({
        ...current,
        [activeReview.id]: "항목 slug에는 어떤 언어든 문자, 숫자, 공백, 하이픈을 사용할 수 있습니다.",
      }));
      setPendingId(null);
      return;
    }

    try {
      await resolveAndApprove({
        reviewId: activeReview.id,
        nodeId: selectedItem?.id,
        categorySlug: selectedItem ? undefined : activeCategorySlug || undefined,
        newCategoryName: selectedItem ? undefined : activeNewCategoryName || undefined,
        newCategorySlug: selectedItem ? undefined : activeNewCategorySlug || undefined,
        newItemTitle: selectedItem ? undefined : activeNewItemTitle || undefined,
        newItemSummary: selectedItem ? undefined : activeNewItemSummary.trim() || "-",
        newItemSlug: selectedItem ? undefined : activeNewItemSlug || undefined,
        coverImage: selectedItem ? undefined : activeCoverImage || undefined,
        attributes: selectedItem ? undefined : getAttributes(activeReview.id, activeCategory),
      });
      setOpenReviewId(null);
    } catch (caught) {
      setMessages((current) => ({
        ...current,
        [activeReview.id]: caught instanceof Error ? caught.message : "처리에 실패했습니다.",
      }));
    } finally {
      setPendingId(null);
    }
  }

  async function handleReject() {
    if (!activeReview) return;

    setPendingId(activeReview.id);
    try {
      await reject({ reviewId: activeReview.id });
      setOpenReviewId(null);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Table className="border border-white/10">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[42%]">리뷰</TableHead>
            <TableHead className="w-[20%]">작성자</TableHead>
            <TableHead className="w-[16%]">점수</TableHead>
            <TableHead className="w-[22%]">요청일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => (
            <TableRow
              className="cursor-pointer hover:bg-[#1c1b1b]"
              key={review.id}
              onClick={() => setOpenReviewId(review.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setOpenReviewId(review.id);
                }
              }}
              tabIndex={0}
            >
              <TableCell>
                <p className="font-black tracking-tight text-white">{getReviewDisplayTitle(review)}</p>
              </TableCell>
              <TableCell className="text-[#c2c6d8]">{review.author?.name ?? "알 수 없음"}</TableCell>
              <TableCell className="font-black text-[#ffb599]">
                {typeof review.rating === "number" ? formatCompactRating(review.rating) : "-"}
              </TableCell>
              <TableCell className="text-[#8c90a1]">{formatReviewDate(review.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Sheet
        open={Boolean(activeReview)}
        onOpenChange={(open) => {
          if (!open) {
            setOpenReviewId(null);
          }
        }}
      >
        {activeReview ? (
          <SheetContent className="max-h-[90vh] w-full overflow-y-auto p-4 sm:max-w-xl">
            <SheetHeader className="px-1">
              <SheetTitle>검토 항목</SheetTitle>
              <SheetDescription>{getReviewDisplayTitle(activeReview)}</SheetDescription>
            </SheetHeader>

            <div className="grid gap-6 p-1">
              <section className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8c90a1]">리뷰 본문</p>
                {activeReview.spoiler ? (
                  <ReviewSpoilerGate
                    confirmLabel="본문 확인"
                    description="검토 대상 본문에 스포일러가 포함되어 있습니다."
                    title="스포일러 본문"
                  >
                    <div className="max-h-44 whitespace-pre-line overflow-auto border border-white/8 bg-[#0e0e0e] px-4 py-3 text-sm text-[#c2c6d8]">
                      {activeReview.body}
                    </div>
                  </ReviewSpoilerGate>
                ) : (
                  <div className="max-h-44 whitespace-pre-line overflow-auto border border-white/8 bg-[#0e0e0e] px-4 py-3 text-sm text-[#c2c6d8]">
                    {activeReview.body}
                  </div>
                )}
              </section>

              <section className="space-y-2">
                <ContentNodePicker
                  label="항목"
                  matches={matches}
                  onClearSelection={() =>
                    setSelectedItemIds((current) => ({ ...current, [activeReview.id]: "" }))
                  }
                  onSearchChange={(value) =>
                    setSearches((current) => ({ ...current, [activeReview.id]: value }))
                  }
                  onSelect={(item) => {
                    setSelectedItemIds((current) => ({ ...current, [activeReview.id]: item.id }));
                    setSearches((current) => ({ ...current, [activeReview.id]: item.title }));
                    setMessages((current) => ({ ...current, [activeReview.id]: "" }));
                  }}
                  search={search}
                  selectedItem={selectedItem}
                />
              </section>

              {!selectedItem && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <select
                      className="border border-white/5 bg-[#0e0e0e] px-4 py-3 text-sm font-bold text-white md:col-span-2"
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setCategorySlugs((current) => ({ ...current, [activeReview.id]: value }));
                      }}
                      value={activeCategorySlug}
                    >
                      <option value="">카테고리 선택</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {!activeCategorySlug ? (
                      <>
                        <input
                          className="border border-white/5 bg-[#0e0e0e] px-4 py-3 text-sm font-bold text-white"
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            setNewCategoryNames((current) => ({ ...current, [activeReview.id]: value }));
                          }}
                          placeholder="새 카테고리 이름"
                          value={activeNewCategoryName}
                        />
                        <input
                          className="border border-white/5 bg-[#0e0e0e] px-4 py-3 text-sm font-bold text-white"
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            setNewCategorySlugs((current) => ({ ...current, [activeReview.id]: value }));
                          }}
                          placeholder="새 카테고리 slug"
                          value={activeNewCategorySlug}
                        />
                      </>
                    ) : null}
                    <input
                      className="border border-white/5 bg-[#0e0e0e] px-4 py-3 text-sm font-bold text-white"
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setNewItemTitles((current) => ({ ...current, [activeReview.id]: value }));
                      }}
                      placeholder="새 항목 제목"
                      value={activeNewItemTitle}
                    />
                    <input
                      className="border border-white/5 bg-[#0e0e0e] px-4 py-3 text-sm font-bold text-white"
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setNewItemSlugs((current) => ({ ...current, [activeReview.id]: value }));
                        setNewItemSlugOverrides((current) => ({
                          ...current,
                          [activeReview.id]: Boolean(value.trim()) && value !== normalizeSearchSlug(activeNewItemTitle),
                        }));
                      }}
                      placeholder="새 항목 slug"
                      value={activeNewItemSlug}
                    />
                  </div>

                  <textarea
                    className="min-h-28 w-full border border-white/5 bg-[#0e0e0e] px-4 py-3 text-sm text-white placeholder:text-white/30"
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setNewItemSummaries((current) => ({ ...current, [activeReview.id]: value }));
                    }}
                    placeholder="새 항목 설명 (비우면 -)"
                    value={activeNewItemSummary}
                  />

                  <PosterUploadField
                    onChange={(value) =>
                      setCoverImages((current) => ({ ...current, [activeReview.id]: value ?? "" }))
                    }
                    title={activeNewItemTitle || activeReview.proposedTitle || "포스터"}
                    value={activeCoverImage || undefined}
                  />

                  {activeCategory?.fieldDefinitions.length ? (
                    <div className="space-y-3">
                      <span className="text-sm font-bold text-white">메타데이터</span>
                      {activeCategory.fieldDefinitions.map((field) => (
                        <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]" key={field.key}>
                          <div className="flex h-12 items-center border border-white/5 bg-[#0e0e0e] px-4 text-sm font-bold text-white">
                            {field.label}
                          </div>
                          <MetadataValueInput
                            onChange={(value) =>
                              setDefinedValuesByReview((current) => ({
                                ...current,
                                [activeReview.id]: {
                                  ...(current[activeReview.id] ?? {}),
                                  [field.key]: value,
                                },
                              }))
                            }
                            type={field.type}
                            value={
                              activeDefinedValues[field.key] ??
                              (field.type === "boolean"
                                ? false
                                : formatMetadataValueForInput(undefined, field.type))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-white">추가 메타데이터</span>
                      <Button
                        className="rounded-none border-white/10"
                        onClick={() =>
                          setCustomRowsByReview((current) => ({
                            ...current,
                            [activeReview.id]: [...(current[activeReview.id] ?? []), createEmptyMetadataRow()],
                          }))
                        }
                        type="button"
                        variant="outline"
                      >
                        필드 추가
                      </Button>
                    </div>
                    {activeCustomRows.map((row, index) => (
                      <div
                        className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)_auto]"
                        key={row.id}
                      >
                        <Input
                          className="h-12 rounded-none border-white/5 bg-[#0e0e0e] px-4 text-white"
                          onBlur={(event) => {
                            const key = normalizeMetadataKey(event.currentTarget.value);
                            setCustomRowsByReview((current) => ({
                              ...current,
                              [activeReview.id]: (current[activeReview.id] ?? []).map(
                                (entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, key } : entry
                              ),
                            }));
                          }}
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            setCustomRowsByReview((current) => ({
                              ...current,
                              [activeReview.id]: (current[activeReview.id] ?? []).map(
                                (entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, key: value } : entry
                              ),
                            }));
                          }}
                          placeholder="key"
                          value={row.key}
                        />
                        <select
                          className="h-12 w-full rounded-none border border-white/5 bg-[#0e0e0e] px-4 text-white"
                          onChange={(event) => {
                            const value = event.currentTarget.value as MetadataFieldType;
                            setCustomRowsByReview((current) => ({
                              ...current,
                              [activeReview.id]: (current[activeReview.id] ?? []).map(
                                (entry, entryIndex) =>
                                  entryIndex === index
                                    ? {
                                        ...entry,
                                        type: value,
                                        value:
                                          value === "boolean"
                                            ? false
                                            : typeof entry.value === "boolean"
                                              ? ""
                                              : entry.value,
                                      }
                                    : entry
                              ),
                            }));
                          }}
                          value={row.type}
                        >
                          {metadataFieldTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <MetadataValueInput
                          onChange={(value) =>
                            setCustomRowsByReview((current) => ({
                              ...current,
                              [activeReview.id]: (current[activeReview.id] ?? []).map(
                                (entry, entryIndex) =>
                                  entryIndex === index ? { ...entry, value } : entry
                              ),
                            }))
                          }
                          type={row.type}
                          value={row.value}
                        />
                        <Button
                          className="rounded-none border-red-600 text-red-500 hover:bg-red-600/10 hover:text-red-400"
                          onClick={() =>
                            setCustomRowsByReview((current) => ({
                              ...current,
                              [activeReview.id]: (current[activeReview.id] ?? []).filter(
                                (_, entryIndex) => entryIndex !== index
                              ),
                            }))
                          }
                          type="button"
                          variant="outline"
                        >
                          삭제
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  className="rounded-none bg-[#b0c6ff] text-[#0e0e0e] hover:bg-[#9eb1ff] hover:text-[#0e0e0e] uppercase tracking-widest"
                  disabled={pendingId === activeReview.id}
                  onClick={handleApprove}
                  type="button"
                >
                  연결 후 승인
                </Button>
                <Button
                  className="rounded-none uppercase tracking-widest"
                  disabled={pendingId === activeReview.id}
                  onClick={handleReject}
                  type="button"
                  variant="outline"
                >
                  반려
                </Button>
                <ReviewDeleteButton redirectHref="/admin/reviews" reviewId={activeReview.id} />

                {message ? <p className="self-center text-[11px] font-bold uppercase tracking-widest text-red-400">{message}</p> : null}
              </div>
            </div>
          </SheetContent>
        ) : null}
      </Sheet>
    </div>
  );
}
