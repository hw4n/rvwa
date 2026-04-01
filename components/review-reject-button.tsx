/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function ReviewRejectButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const rejectReview = useMutation("reviews:reject" as any);
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleReject() {
    setPending(true);

    try {
      await rejectReview({ reviewId });
      toast.success("리뷰를 반려했습니다.");
      setOpen(false);
      router.refresh();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "리뷰 반려에 실패했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) {
          setOpen(nextOpen);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          className="rounded-none uppercase tracking-widest font-bold"
          disabled={pending}
          type="button"
          variant="warning"
        >
          반려
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>반려 상태로 바꾸시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            이 리뷰는 반려 상태로 변경되며, 이후 다시 검토 전까지 공개되지 않습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button disabled={pending} type="button" variant="outline">
              취소
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                void handleReject();
              }}
              type="button"
              variant="warning"
            >
              반려
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
