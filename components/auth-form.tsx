"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthMode = "signIn" | "signUp";

export function AuthForm({
  mode,
  redirectTo = "/dashboard",
  variant = "page",
}: {
  mode: AuthMode;
  redirectTo?: string | null;
  variant?: "page" | "embedded";
}) {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [currentMode, setCurrentMode] = React.useState<AuthMode>(mode);
  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  React.useEffect(() => {
    if (variant === "page" && !isLoading && isAuthenticated && redirectTo) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router, variant]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      await signIn("password", {
        flow: currentMode,
        email,
        password,
        displayName,
      });
      if (redirectTo) {
        router.replace(redirectTo);
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "인증에 실패했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className={`space-y-6 ${
        variant === "embedded"
          ? "w-full"
          : "w-full max-w-md border-l-2 border-primary/50 bg-surface-low p-6 md:p-10"
      }`}
      onSubmit={onSubmit}
    >
      {currentMode === "signUp" ? (
        <Input
          className="h-12 rounded-none border-border bg-surface-lowest px-4 text-foreground"
          onChange={(event) => setDisplayName(event.currentTarget.value)}
          placeholder="(변경가능) display name"
          value={displayName}
        />
      ) : null}
      <Input
        className="h-12 rounded-none border-border bg-surface-lowest px-4 text-foreground"
        onChange={(event) => setEmail(event.currentTarget.value)}
        placeholder={currentMode === "signUp" ? "(변경불가) email" : "email"}
        type="email"
        value={email}
      />
      <Input
        className="h-12 rounded-none border-border bg-surface-lowest px-4 text-foreground"
        onChange={(event) => setPassword(event.currentTarget.value)}
        placeholder="password"
        type="password"
        value={password}
      />
      {error ? <p className="text-[11px] font-bold uppercase tracking-widest text-red-400">{error}</p> : null}
      <div className="flex flex-col md:flex-row gap-3">
        <Button
          className="w-full rounded-none uppercase tracking-widest font-bold md:w-auto"
          disabled={pending}
          type="submit"
        >
          {currentMode === "signIn" ? "로그인" : "가입한다"}
        </Button>
        {variant === "embedded" ? (
          <Button
            className="w-full rounded-none uppercase tracking-widest font-bold md:w-auto"
            onClick={() => {
              setCurrentMode((current) => current === "signIn" ? "signUp" : "signIn");
              setError("");
            }}
            type="button"
            variant="outline"
          >
            {currentMode === "signIn" ? "회원이 되고 싶습니다" : "저는 이미 회원입니다"}
          </Button>
        ) : (
          <Button asChild className="w-full rounded-none uppercase tracking-widest font-bold md:w-auto" variant="outline">
            <Link href={currentMode === "signIn" ? "/signup" : "/login"}>
              {currentMode === "signIn" ? "회원이 되고 싶습니다" : "저는 이미 회원입니다"}
            </Link>
          </Button>
        )}
      </div>
    </form>
  );
}
