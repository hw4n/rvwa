/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Button } from "@/components/ui/button";

export function ReviewRejectButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const rejectReview = useMutation("reviews:reject" as any);
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      className="rounded-none uppercase tracking-[0.15em]"
      disabled={pending}
      onClick={async () => {
        if (!window.confirm("반려 상태로 바꾸시겠습니까?")) {
          return;
        }

        setPending(true);
        try {
          await rejectReview({ reviewId });
          router.refresh();
        } finally {
          setPending(false);
        }
      }}
      type="button"
      variant="outline"
    >
      반려
    </Button>
  );
}
