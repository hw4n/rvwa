/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import type { Category, ContentNode, MetadataFieldType } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PosterUploadField } from "@/components/poster-upload-field";
import { Switch } from "@/components/ui/switch";
import {
  formatMetadataValueForInput,
  inferMetadataFieldType,
  isValidMetadataKeyInput,
  metadataFieldTypeOptions,
  normalizeMetadataKey,
  parseMetadataValue,
} from "@/lib/metadata";
import { isValidItemSlugInput } from "@/lib/slug";

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

async function deletePosterQueue(urls: string[]) {
  await Promise.allSettled(
    urls.map((coverImageUrl) =>
      fetch("/api/posters/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ coverImageUrl }),
      })
    )
  );
}

export function NodeCreateForm({
  category,
  nodes,
  initialNode,
}: {
  category: Category;
  nodes: ContentNode[];
  initialNode?: ContentNode;
}) {
  const router = useRouter();
  const createNode = useMutation("nodes:create" as any);
  const updateNode = useMutation("nodes:update" as any);
  const isEdit = Boolean(initialNode);
  const definedFieldKeys = React.useMemo(
    () => new Set(category.fieldDefinitions.map((field) => field.key)),
    [category.fieldDefinitions]
  );
  const [title, setTitle] = React.useState(initialNode?.title ?? "");
  const [slug, setSlug] = React.useState(initialNode?.slug ?? "");
  const [summary, setSummary] = React.useState(initialNode?.summary ?? "");
  const [coverImage, setCoverImage] = React.useState(initialNode?.coverImage ?? "");
  const [tags, setTags] = React.useState(initialNode?.tagSlugs.join(", ") ?? "");
  const [parentId, setParentId] = React.useState(initialNode?.parentId ?? "");
  const [definedValues, setDefinedValues] = React.useState<Record<string, string | boolean>>(() =>
    Object.fromEntries(
      category.fieldDefinitions.map((field) => [
        field.key,
        formatMetadataValueForInput(initialNode?.attributes?.[field.key], field.type),
      ])
    )
  );
  const [customRows, setCustomRows] = React.useState<EditableMetadataRow[]>(() =>
    Object.entries(initialNode?.attributes ?? {})
      .filter(([key]) => !definedFieldKeys.has(key))
      .map(([key, value]) => {
        const type = inferMetadataFieldType(value);
        return {
          id: `${key}-${type}`,
          key,
          type,
          value: formatMetadataValueForInput(value, type),
        };
      })
  );
  const [error, setError] = React.useState("");
  const [queuedPosterDeletes, setQueuedPosterDeletes] = React.useState<string[]>([]);

  function getAttributes() {
    const nextAttributes: Record<string, string | number | boolean | string[]> = {};
    const seenKeys = new Set<string>();

    for (const field of category.fieldDefinitions) {
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

  return (
    <form
      className="bg-[#131313] p-10 border-l-2 border-primary/50 space-y-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        if (!isValidItemSlugInput(slug)) {
          setError("항목 slug에는 어떤 언어든 문자, 숫자, 공백, 하이픈을 사용할 수 있습니다.");
          return;
        }
        try {
          const payload = {
            categorySlug: category.slug,
            title,
            slug,
            summary,
            coverImage: coverImage || undefined,
            tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
            parentId: parentId || undefined,
            attributes: getAttributes(),
          };
          const result = isEdit
            ? await updateNode({
                currentSlug: initialNode!.slug,
                ...payload,
              })
            : await createNode(payload);
          if (queuedPosterDeletes.length) {
            await deletePosterQueue(queuedPosterDeletes);
          }
          router.push(`/n/${result.slug}`);
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : isEdit ? "수정에 실패했습니다." : "생성에 실패했습니다.");
        }
      }}
    >
      <Input className="h-12 rounded-none border-white/5 bg-[#0e0e0e] px-4 text-white" onChange={(event) => setTitle(event.currentTarget.value)} placeholder="항목 제목" value={title} />
      <Input className="h-12 rounded-none border-white/5 bg-[#0e0e0e] px-4 text-white" onChange={(event) => setSlug(event.currentTarget.value)} placeholder="slug" value={slug} />
      <Input className="h-12 rounded-none border-white/5 bg-[#0e0e0e] px-4 text-white" onChange={(event) => setTags(event.currentTarget.value)} placeholder="tags, comma, separated" value={tags} />
      <PosterUploadField
        initialValue={initialNode?.coverImage}
        onChange={(value) => setCoverImage(value ?? "")}
        onQueuePersistedDelete={(value) =>
          setQueuedPosterDeletes((current) => Array.from(new Set([...current, value])))
        }
        title={title || initialNode?.title || "포스터"}
        value={coverImage || undefined}
      />
      <select className="h-12 w-full rounded-none border border-white/5 bg-[#0e0e0e] px-4 text-white" onChange={(event) => setParentId(event.currentTarget.value)} value={parentId}>
        <option value="">상위 없음</option>
        {nodes.map((node) => (
          <option key={node.id} value={node.id}>
            {node.title}
          </option>
        ))}
      </select>
      <textarea className="min-h-[220px] w-full border border-white/5 bg-[#0e0e0e] p-4 text-sm text-white focus:border-primary/30" onChange={(event) => setSummary(event.currentTarget.value)} placeholder="요약" value={summary} />
      {category.fieldDefinitions.length ? (
        <div className="space-y-3">
          <span className="text-sm font-bold text-white">메타데이터</span>
          {category.fieldDefinitions.map((field) => (
            <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]" key={field.key}>
              <div className="flex h-12 items-center border border-white/5 bg-[#0e0e0e] px-4 text-sm font-bold text-white">
                {field.label}
              </div>
              <MetadataValueInput
                onChange={(value) =>
                  setDefinedValues((current) => ({
                    ...current,
                    [field.key]: value,
                  }))
                }
                type={field.type}
                value={definedValues[field.key] ?? (field.type === "boolean" ? false : "")}
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
            onClick={() => setCustomRows((current) => [...current, createEmptyMetadataRow()])}
            type="button"
            variant="outline"
          >
            필드 추가
          </Button>
        </div>
        {customRows.map((row, index) => (
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)_auto]" key={row.id}>
            <Input
              className="h-12 rounded-none border-white/5 bg-[#0e0e0e] px-4 text-white"
              onBlur={(event) => {
                const key = normalizeMetadataKey(event.currentTarget.value);
                setCustomRows((current) =>
                  current.map((entry, entryIndex) =>
                    entryIndex === index ? { ...entry, key } : entry
                  )
                );
              }}
              onChange={(event) =>
                {
                  const value = event.currentTarget.value;
                  setCustomRows((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, key: value } : entry
                    )
                  );
                }
              }
              placeholder="key"
              value={row.key}
            />
            <select
              className="h-12 w-full rounded-none border border-white/5 bg-[#0e0e0e] px-4 text-white"
              onChange={(event) =>
                {
                  const value = event.currentTarget.value as MetadataFieldType;
                  setCustomRows((current) =>
                    current.map((entry, entryIndex) =>
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
                    )
                  );
                }
              }
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
                setCustomRows((current) =>
                  current.map((entry, entryIndex) =>
                    entryIndex === index ? { ...entry, value } : entry
                  )
                )
              }
              type={row.type}
              value={row.value}
            />
            <Button
              className="rounded-none border-red-600 text-red-500 hover:bg-red-600/10 hover:text-red-400"
              onClick={() =>
                setCustomRows((current) => current.filter((_, entryIndex) => entryIndex !== index))
              }
              type="button"
              variant="outline"
            >
              삭제
            </Button>
          </div>
        ))}
      </div>
      {error ? <p className="text-[11px] font-bold uppercase tracking-widest text-red-400">{error}</p> : null}
      <Button className="rounded-none bg-primary hover:bg-primary/80" type="submit">
        {isEdit ? "저장" : "생성"}
      </Button>
    </form>
  );
}
