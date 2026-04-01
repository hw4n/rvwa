"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthForm({ mode }: { mode: "signIn" | "signUp" }) {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      await signIn("password", {
        flow: mode,
        email,
        password,
        displayName,
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "인증에 실패했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="w-full max-w-md space-y-6 border-l-2 border-primary/50 bg-surface-low p-6 md:p-10"
      onSubmit={onSubmit}
    >
      {mode === "signUp" ? (
        <Input
          className="h-12 rounded-none border-border bg-surface-lowest px-4 text-foreground"
          onChange={(event) => setDisplayName(event.currentTarget.value)}
          placeholder="display name"
          value={displayName}
        />
      ) : null}
      <Input
        className="h-12 rounded-none border-border bg-surface-lowest px-4 text-foreground"
        onChange={(event) => setEmail(event.currentTarget.value)}
        placeholder="email"
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
          {mode === "signIn" ? "로그인" : "가입"}
        </Button>
        <Button asChild className="w-full rounded-none uppercase tracking-widest font-bold md:w-auto" variant="outline">
          <Link href={mode === "signIn" ? "/signup" : "/login"}>
            {mode === "signIn" ? "가입" : "로그인"}
          </Link>
        </Button>
      </div>
    </form>
  );
}
