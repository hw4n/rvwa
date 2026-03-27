/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import type { UserSummary } from "@/lib/domain";

async function fetchViewer(token?: string) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL || !token) {
    return null;
  }

  return (await fetchQuery("users:viewer" as any, {}, { token })) as UserSummary | null;
}

export async function getViewerToken() {
  return await convexAuthNextjsToken();
}

export async function getViewer() {
  return await fetchViewer(await getViewerToken());
}

export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) {
    redirect("/login");
  }
  return viewer;
}

export async function requireAdmin() {
  const viewer = await requireViewer();
  if (viewer.role !== "admin") {
    redirect("/dashboard");
  }
  return viewer;
}
