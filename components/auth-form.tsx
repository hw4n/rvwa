"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUTH_DISPLAY_NAME_MAX_LENGTH, AUTH_PASSWORD_MIN_LENGTH } from "@/lib/auth-constraints";

type AuthMode = "signIn" | "signUp";

function getAuthErrorMessage(caught: unknown, mode: AuthMode) {
  if (!(caught instanceof Error)) {
    return "인증에 실패했습니다.";
  }

  if (caught.message.includes("Password must be at least")) {
    return `비밀번호는 ${AUTH_PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`;
  }

  if (caught.message.includes("Handle must be")) {
    return `표시 이름은 ${AUTH_DISPLAY_NAME_MAX_LENGTH}자 이하여야 합니다.`;
  }

  if (caught.message.includes("InvalidAccountId") || caught.message.includes("Invalid credentials")) {
    return "이메일 또는 비밀번호를 확인해 주세요.";
  }

  if (caught.message.includes("Server Error")) {
    return mode === "signIn"
      ? "이메일 또는 비밀번호를 확인해 주세요."
      : "입력값을 확인한 뒤 다시 시도해 주세요.";
  }

  return caught.message;
}

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
    setDisplayName("");
    setError("");
  }, [mode]);

  React.useEffect(() => {
    if (currentMode === "signIn" && displayName) {
      setDisplayName("");
    }
  }, [currentMode, displayName]);

  React.useEffect(() => {
    if (variant === "page" && !isLoading && isAuthenticated && redirectTo) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router, variant]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();
    const normalizedDisplayName = displayName.trim();

    if (!normalizedEmail) {
      setError("이메일을 입력해 주세요.");
      return;
    }

    if (!password) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }

    if (password.length < AUTH_PASSWORD_MIN_LENGTH) {
      setError(`비밀번호는 ${AUTH_PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`);
      return;
    }

    if (currentMode === "signUp" && normalizedDisplayName.length > AUTH_DISPLAY_NAME_MAX_LENGTH) {
      setError(`표시 이름은 ${AUTH_DISPLAY_NAME_MAX_LENGTH}자 이하여야 합니다.`);
      return;
    }

    setPending(true);
    setError("");

    try {
      const params: {
        flow: AuthMode;
        email: string;
        password: string;
        displayName?: string;
      } = {
        flow: currentMode,
        email: normalizedEmail,
        password,
      };

      if (currentMode === "signUp" && normalizedDisplayName) {
        params.displayName = normalizedDisplayName;
      }

      await signIn("password", params);
      if (redirectTo) {
        router.replace(redirectTo);
      }
      router.refresh();
    } catch (caught) {
      setError(getAuthErrorMessage(caught, currentMode));
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
          maxLength={AUTH_DISPLAY_NAME_MAX_LENGTH}
          onChange={(event) => setDisplayName(event.currentTarget.value)}
          placeholder="(변경가능) display name"
          value={displayName}
        />
      ) : null}
      <Input
        className="h-12 rounded-none border-border bg-surface-lowest px-4 text-foreground"
        required
        onChange={(event) => setEmail(event.currentTarget.value)}
        placeholder={currentMode === "signUp" ? "(변경불가) email" : "email"}
        type="email"
        value={email}
      />
      <Input
        className="h-12 rounded-none border-border bg-surface-lowest px-4 text-foreground"
        minLength={AUTH_PASSWORD_MIN_LENGTH}
        required
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
