"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";

export function LogoutButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      className={className}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await signOut();
          router.push("/login");
        } finally {
          setPending(false);
        }
      }}
      type="button"
      variant="outline"
    >
      {children}
    </Button>
  );
}
