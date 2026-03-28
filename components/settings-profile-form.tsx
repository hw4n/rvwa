"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SettingsProfileForm({
  initialDisplayName,
  email,
}: {
  initialDisplayName: string;
  email: string;
}) {
  const router = useRouter();
  const updateDisplayName = useMutation("users:updateDisplayName" as any);
  const [displayName, setDisplayName] = React.useState(initialDisplayName);
  const [error, setError] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setStatus("");

    try {
      await updateDisplayName({ displayName });
      setStatus("변경 사항을 저장했습니다.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "설정을 저장하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="space-y-8 border border-white/5 bg-surface-low p-6 md:p-8"
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Profile</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40" htmlFor="display-name">
            Display name
          </label>
          <Input
            className="h-12 rounded-none border-white/5 bg-[#0e0e0e] px-4 text-white"
            id="display-name"
            maxLength={40}
            onChange={(event) => setDisplayName(event.currentTarget.value)}
            placeholder="display name"
            value={displayName}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40" htmlFor="email">
            Email
          </label>
          <Input
            className="h-12 rounded-none border-white/5 bg-[#0e0e0e] px-4 text-white/50"
            id="email"
            readOnly
            value={email}
          />
        </div>
      </div>

      {error ? <p className="text-[11px] font-bold uppercase tracking-widest text-red-400">{error}</p> : null}
      {status ? <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{status}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button
          className="rounded-none bg-primary text-black hover:bg-primary/80"
          disabled={pending}
          type="submit"
        >
          저장
        </Button>
      </div>
    </form>
  );
}
