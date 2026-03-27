/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Button } from "@/components/ui/button";

export function NodeDeleteButton({ slug }: { slug: string }) {
  const router = useRouter();
  const removeNode = useMutation("nodes:remove" as any);
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      className="rounded-none"
      disabled={pending}
      onClick={async () => {
        if (!window.confirm("항목을 삭제하시겠습니까?")) {
          return;
        }

        setPending(true);
        try {
          const result = await removeNode({ slug });
          router.push(`/c/${result.categorySlug}`);
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
