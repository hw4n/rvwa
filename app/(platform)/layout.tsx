import { Suspense } from "react";
import { PlatformShell } from "@/components/platform-shell";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-mid" />}>
      <PlatformShell>{children}</PlatformShell>
    </Suspense>
  );
}
