"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AuthForm } from "@/components/auth-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoutButton } from "@/components/logout-button";
import type { UserSummary } from "@/lib/domain";

export function SettingsProfileForm({
  viewer,
}: {
  viewer: UserSummary | null;
}) {
  const router = useRouter();
  const updateDisplayName = useMutation(api.users.updateDisplayName);
  const [displayName, setDisplayName] = React.useState(viewer?.name ?? "");
  const [error, setError] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    setDisplayName(viewer?.name ?? "");
  }, [viewer?.name]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!viewer) {
      return;
    }

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

  if (!viewer) {
    return (
      <section className="space-y-8 border border-border bg-surface-low p-6 md:p-8">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Profile</p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            리뷰를 작성하기 위해서는 회원이 되어주세요.
          </p>
          <AuthForm mode="signIn" redirectTo={null} variant="embedded" />
        </div>
      </section>
    );
  }

  return (
    <form
      className="space-y-8 border border-border bg-surface-low p-6 md:p-8"
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Profile</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground" htmlFor="display-name">
            Display name
          </label>
          <Input
            className="h-12 rounded-none border-border bg-surface-lowest px-4 text-foreground"
            id="display-name"
            maxLength={40}
            onChange={(event) => setDisplayName(event.currentTarget.value)}
            placeholder="display name"
            value={displayName}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground" htmlFor="email">
            (변경불가) {viewer.email}
          </label>
          <Input
            className="h-12 rounded-none border-border bg-surface-lowest px-4 text-muted-foreground"
            id="email"
            readOnly
            value={viewer.email}
          />
        </div>
      </div>

      {error ? <p className="text-[11px] font-bold uppercase tracking-widest text-red-400">{error}</p> : null}
      {status ? <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{status}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button
          className="rounded-none uppercase tracking-widest font-bold"
          disabled={pending}
          type="submit"
        >
          저장
        </Button>
        <LogoutButton
          className="rounded-none border-border hover:bg-surface-high uppercase tracking-widest font-bold"
          redirectTo={null}
        >
          로그아웃
        </LogoutButton>
      </div>
    </form>
  );
}
