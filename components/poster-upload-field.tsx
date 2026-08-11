/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { getPosterImageUrl, validatePosterFile } from "@/lib/poster";
import { uploadPosterFile } from "@/lib/poster-upload-client";

async function deletePosterNow(coverImageUrl: string) {
  const response = await fetch("/api/posters/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ coverImageUrl }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "이미지 삭제에 실패했습니다.");
  }
}

export function PosterUploadField({
  initialValue,
  title,
  value,
  onChange,
  onQueuePersistedDelete,
}: {
  initialValue?: string;
  title: string;
  value?: string;
  onChange: (value?: string) => void;
  onQueuePersistedDelete?: (value: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [error, setError] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const previewUrl = getPosterImageUrl(value, "card");

  async function handleSelectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    setError("");

    try {
      validatePosterFile(file);
      setIsUploading(true);
      const nextUrl = await uploadPosterFile(file);
      const previousUrl = value;

      if (previousUrl && previousUrl !== nextUrl) {
        if (initialValue && previousUrl === initialValue) {
          onQueuePersistedDelete?.(previousUrl);
        } else {
          await deletePosterNow(previousUrl).catch(() => undefined);
        }
      }

      onChange(nextUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "이미지 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove() {
    if (!value) {
      return;
    }

    setError("");

    try {
      if (initialValue && value === initialValue) {
        onQueuePersistedDelete?.(value);
      } else {
        await deletePosterNow(value);
      }

      onChange(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "이미지 삭제에 실패했습니다.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-foreground">포스터</span>
        <input
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={handleSelectFile}
          ref={inputRef}
          type="file"
        />
        <div className="flex gap-2">
          <Button
            className="rounded-none border-border"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            type="button"
            variant="outline"
          >
            {value ? "교체" : "업로드"}
          </Button>
          {value ? (
            <Button
              className="rounded-none uppercase tracking-widest font-bold"
              disabled={isUploading}
              onClick={handleRemove}
              type="button"
              variant="destructive"
            >
              삭제
            </Button>
          ) : null}
        </div>
      </div>
      <div className="aspect-[2/3] w-full max-w-[220px] overflow-hidden border border-border bg-surface-lowest">
        {previewUrl ? (
          <img
            alt={`${title} 포스터`}
            className="h-full w-full object-cover"
            loading="lazy"
            src={previewUrl}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-black text-foreground/20">
            {title.charAt(0) || "P"}
          </div>
        )}
      </div>
      {error ? <p className="text-[11px] font-bold uppercase tracking-widest text-red-400">{error}</p> : null}
    </div>
  );
}
