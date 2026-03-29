"use client";

import * as React from "react";
import { useDeferredValue } from "react";
import type { ContentNode } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { normalizeSearchSlug } from "@/lib/slug";

type UseContentNodePickerArgs = {
  items: ContentNode[];
  search: string;
  selectedItem?: ContentNode;
  limit?: number;
};

export function useContentNodePicker({
  items,
  search,
  selectedItem,
  limit = 8,
}: UseContentNodePickerArgs) {
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const deferredTagSearch = useDeferredValue(normalizeSearchSlug(search));
  const matches = deferredSearch
    ? items
        .filter((item) => {
          const searchableText = `${item.title} ${item.categorySlug}`.toLowerCase();

          if (searchableText.includes(deferredSearch)) {
            return true;
          }

          return item.tagSlugs.some((tag) => {
            const normalizedTag = normalizeSearchSlug(tag);
            return tag.toLowerCase().includes(deferredSearch) || (!!deferredTagSearch && normalizedTag.includes(deferredTagSearch));
          });
        })
        .slice(0, limit)
    : [];
  const hasNoResults = !selectedItem && !!search.trim() && matches.length === 0;

  return {
    hasNoResults,
    matches,
  };
}

export function ContentNodePicker({
  emptyActionLabel,
  emptyMessage = "일치하는 항목이 없습니다.",
  label = "항목",
  matches,
  onClearSelection,
  onEmptyAction,
  onSearchChange,
  onSelect,
  placeholder = "항목 검색 또는 새 항목 입력",
  required = false,
  search,
  selectedItem,
}: {
  emptyActionLabel?: string;
  emptyMessage?: string;
  label?: string;
  matches: ContentNode[];
  onClearSelection: () => void;
  onEmptyAction?: (keyword: string) => void;
  onSearchChange: (value: string) => void;
  onSelect: (item: ContentNode) => void;
  placeholder?: string;
  required?: boolean;
  search: string;
  selectedItem?: ContentNode;
}) {
  const hasNoResults = !selectedItem && !!search.trim() && matches.length === 0;
  const showEmptyAction = !selectedItem && !!search.trim() && !!onEmptyAction;
  const emptyActionButton = showEmptyAction ? (
    <button
      className="group flex w-full items-center justify-between bg-surface-low px-4 py-3 text-left transition-colors hover:bg-surface-high"
      onClick={() => onEmptyAction(search.trim())}
      type="button"
    >
      <span className="flex items-center gap-2 font-black tracking-tight transition-colors">
        <span className="min-w-0 truncate text-white group-hover:text-primary">{search.trim()}</span>
        <span className="shrink-0 text-orange-300">{emptyActionLabel ?? "새 항목 제안"}</span>
      </span>
    </button>
  ) : null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-black uppercase tracking-[0.3em] text-primary">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </p>
      {selectedItem ? (
        <div className="group flex items-center justify-between gap-4 border border-white/5 bg-surface-high p-4">
          <div className="min-w-0">
            <p className="text-lg font-black tracking-tight text-white">{selectedItem.title}</p>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{selectedItem.categorySlug}</p>
          </div>
          <Button
            className="rounded-none border-white/10 hover:bg-white/5"
            onClick={onClearSelection}
            type="button"
            variant="outline"
          >
            변경
          </Button>
        </div>
      ) : (
        <input
          className="w-full border-b border-white/5 bg-surface-low px-0 py-3 text-2xl font-black tracking-tight text-white transition-colors placeholder:text-white/10 focus:border-primary/40"
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          placeholder={placeholder}
          value={search}
        />
      )}
      {!selectedItem && (matches.length || showEmptyAction) ? (
        <div className="grid overflow-hidden bg-white/5 gap-px">
          {emptyActionButton}
          {matches.map((item) => (
            <button
              className="group flex items-center justify-between bg-surface-low px-4 py-3 text-left transition-colors hover:bg-surface-high"
              key={item.id}
              onClick={() => onSelect(item)}
              type="button"
            >
              <span className="flex items-center gap-2 font-black tracking-tight transition-colors">
                <span className="text-white group-hover:text-primary">{item.title}</span>
                <span className="text-primary">{item.categorySlug}</span>
              </span>
            </button>
          ))}
        </div>
      ) : !selectedItem && hasNoResults ? (
        <div className="border border-white/5 bg-surface-low p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c2c6d8]/20">{emptyMessage}</p>
        </div>
      ) : null}
    </div>
  );
}
