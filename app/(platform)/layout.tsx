import { Suspense } from "react";
import { PlatformShell } from "@/components/platform-shell";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0e0e0e]" />}>
      <PlatformShell>{children}</PlatformShell>
    </Suspense>
  );
}
