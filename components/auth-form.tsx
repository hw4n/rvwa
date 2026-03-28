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
      className="w-full max-w-md bg-[#131313] p-6 md:p-10 border-l-2 border-primary/50 space-y-6"
      onSubmit={onSubmit}
    >
      {mode === "signUp" ? (
        <Input
          className="h-12 rounded-none border-white/5 bg-[#0e0e0e] px-4 text-white"
          onChange={(event) => setDisplayName(event.currentTarget.value)}
          placeholder="display name"
          value={displayName}
        />
      ) : null}
      <Input
        className="h-12 rounded-none border-white/5 bg-[#0e0e0e] px-4 text-white"
        onChange={(event) => setEmail(event.currentTarget.value)}
        placeholder="email"
        type="email"
        value={email}
      />
      <Input
        className="h-12 rounded-none border-white/5 bg-[#0e0e0e] px-4 text-white"
        onChange={(event) => setPassword(event.currentTarget.value)}
        placeholder="password"
        type="password"
        value={password}
      />
      {error ? <p className="text-[11px] font-bold uppercase tracking-widest text-red-400">{error}</p> : null}
      <div className="flex flex-col md:flex-row gap-3">
        <Button
          className="rounded-none bg-primary hover:bg-primary/80 w-full md:w-auto"
          disabled={pending}
          type="submit"
        >
          {mode === "signIn" ? "로그인" : "가입"}
        </Button>
        <Button asChild className="rounded-none border-white/10 w-full md:w-auto" variant="outline">
          <Link href={mode === "signIn" ? "/signup" : "/login"}>
            {mode === "signIn" ? "가입" : "로그인"}
          </Link>
        </Button>
      </div>
    </form>
  );
}
