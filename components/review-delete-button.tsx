/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Button } from "@/components/ui/button";

export function ReviewDeleteButton({
  reviewId,
  redirectHref = "/my-reviews",
  className,
}: {
  reviewId: string;
  redirectHref?: string;
  className?: string;
}) {
  const router = useRouter();
  const deleteReview = useMutation("reviews:deleteOwn" as any);
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      className={`rounded-none uppercase tracking-[0.15em] ${className ?? ""}`}
      disabled={pending}
      onClick={async () => {
        if (!window.confirm("삭제하시겠습니까?")) {
          return;
        }

        setPending(true);
        try {
          await deleteReview({ reviewId });
          router.push(redirectHref);
        } finally {
          setPending(false);
        }
      }}
      type="button"
      variant="destructive"
    >
      삭제
    </Button>
  );
}
