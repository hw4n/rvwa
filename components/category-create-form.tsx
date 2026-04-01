/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { ChevronDown } from "lucide-react";
import { AppIcon, categoryIconOptions } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Category, MetadataFieldDefinition } from "@/lib/domain";
import { isValidMetadataKeyInput, metadataFieldTypeOptions, normalizeMetadataKey } from "@/lib/metadata";
import { isValidCategorySlugInput } from "@/lib/slug";

export function CategoryCreateForm({
  initialCategory,
}: {
  initialCategory?: Category;
}) {
  const router = useRouter();
  const createCategory = useMutation("categories:create" as any);
  const updateCategory = useMutation("categories:update" as any);
  const isEdit = Boolean(initialCategory);
  const [name, setName] = React.useState(initialCategory?.name ?? "");
  const [slug, setSlug] = React.useState(initialCategory?.slug ?? "");
  const [icon, setIcon] = React.useState(initialCategory?.icon ?? "folder");
  const [iconOpen, setIconOpen] = React.useState(false);
  const [description, setDescription] = React.useState(initialCategory?.description ?? "");
  const [fieldDefinitions, setFieldDefinitions] = React.useState<MetadataFieldDefinition[]>(
    initialCategory?.fieldDefinitions ?? []
  );
  const [error, setError] = React.useState("");

  function getSanitizedFieldDefinitions() {
    const seenKeys = new Set<string>();
    const nextFields: MetadataFieldDefinition[] = [];

    for (const field of fieldDefinitions) {
      const hasContent = field.label.trim() || field.key.trim();
      if (!hasContent) {
        continue;
      }

      if (!field.label.trim()) {
        throw new Error("메타데이터 필드 이름을 입력하세요.");
      }

      if (!isValidMetadataKeyInput(field.key)) {
        throw new Error("메타데이터 key는 영문, 숫자, 공백, 하이픈만 사용할 수 있습니다.");
      }

      const key = normalizeMetadataKey(field.key);
      if (!key) {
        throw new Error("메타데이터 key를 입력하세요.");
      }

      if (seenKeys.has(key)) {
        throw new Error(`중복된 메타데이터 key: ${key}`);
      }

      seenKeys.add(key);
      nextFields.push({
        key,
        label: field.label.trim(),
        type: field.type,
      });
    }

    return nextFields;
  }

  return (
    <form
      className="bg-surface-low p-10 border-l-2 border-primary/50 space-y-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        if (!isValidCategorySlugInput(slug)) {
          setError("slug는 문자, 숫자, 공백, 하이픈만 사용할 수 있습니다.");
          return;
        }
        try {
          const nextFieldDefinitions = getSanitizedFieldDefinitions();
          const result = isEdit
            ? await updateCategory({
                currentSlug: initialCategory!.slug,
                name,
                slug,
                icon,
                description,
                fieldDefinitions: nextFieldDefinitions,
              })
            : await createCategory({ name, slug, icon, description, fieldDefinitions: nextFieldDefinitions });
          router.push(`/c/${result.slug}`);
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : isEdit ? "수정에 실패했습니다." : "생성에 실패했습니다.");
        }
      }}
    >
      <Input className="h-12 rounded-none border-border bg-surface-lowest px-4 text-foreground" onChange={(event) => setName(event.currentTarget.value)} placeholder="카테고리 이름" value={name} />
      <Input className="h-12 rounded-none border-border bg-surface-lowest px-4 text-foreground" onChange={(event) => setSlug(event.currentTarget.value)} placeholder="slug" value={slug} />
      <Popover onOpenChange={setIconOpen} open={iconOpen}>
        <PopoverTrigger asChild>
          <Button className="w-full rounded-none border-border bg-surface-lowest hover:bg-surface-high" type="button" variant="outline">
            <span className="flex flex-1 items-center gap-3">
              <AppIcon className="size-4" name={icon} />
              <span>{icon}</span>
            </span>
            <ChevronDown className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[320px]">
          <div className="grid grid-cols-5 gap-1">
            {categoryIconOptions.map((option) => (
              <Button
                className={option === icon ? "bg-surface-high text-primary" : "bg-surface-lowest text-foreground hover:bg-surface-high"}
                key={option}
                onClick={() => {
                  setIcon(option);
                  setIconOpen(false);
                }}
                size="icon"
                type="button"
                variant="ghost"
              >
                <AppIcon className="size-5" name={option} />
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <textarea className="min-h-[180px] w-full border border-border bg-surface-lowest p-4 text-sm text-foreground focus:border-primary/30" onChange={(event) => setDescription(event.currentTarget.value)} placeholder="설명" value={description} />
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-foreground">메타데이터 필드</span>
          <Button
            className="rounded-none border-border"
            onClick={() =>
              setFieldDefinitions((current) => [...current, { key: "", label: "", type: "text" }])
            }
            type="button"
            variant="outline"
          >
            필드 추가
          </Button>
        </div>
        {fieldDefinitions.map((field, index) => (
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_auto]" key={index}>
            <Input
              className="h-12 rounded-none border-border bg-surface-lowest px-4 text-foreground"
              onBlur={() => {
                if (!field.key.trim() && field.label.trim()) {
                  const key = normalizeMetadataKey(field.label);
                  setFieldDefinitions((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, key } : entry
                    )
                  );
                }
              }}
              onChange={(event) =>
                {
                  const value = event.currentTarget.value;
                  setFieldDefinitions((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, label: value } : entry
                    )
                  );
                }
              }
              placeholder="필드 이름"
              value={field.label}
            />
            <Input
              className="h-12 rounded-none border-border bg-surface-lowest px-4 text-foreground"
              onBlur={(event) => {
                const key = normalizeMetadataKey(event.currentTarget.value);
                setFieldDefinitions((current) =>
                  current.map((entry, entryIndex) =>
                    entryIndex === index ? { ...entry, key } : entry
                  )
                );
              }}
              onChange={(event) =>
                {
                  const value = event.currentTarget.value;
                  setFieldDefinitions((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, key: value } : entry
                    )
                  );
                }
              }
              placeholder="internal-key"
              value={field.key}
            />
            <select
              className="h-12 w-full rounded-none border border-border bg-surface-lowest px-4 text-foreground"
              onChange={(event) =>
                {
                  const value = event.currentTarget.value as MetadataFieldDefinition["type"];
                  setFieldDefinitions((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, type: value } : entry
                    )
                  );
                }
              }
              value={field.type}
            >
              {metadataFieldTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              className="rounded-none uppercase tracking-widest font-bold"
              onClick={() =>
                setFieldDefinitions((current) => current.filter((_, entryIndex) => entryIndex !== index))
              }
              type="button"
              variant="destructive"
            >
              삭제
            </Button>
          </div>
        ))}
      </div>
      {error ? <p className="text-[11px] font-bold uppercase tracking-widest text-red-400">{error}</p> : null}
      <Button className="rounded-none uppercase tracking-widest font-bold" type="submit">
        {isEdit ? "저장" : "생성"}
      </Button>
    </form>
  );
}
