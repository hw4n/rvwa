/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import Link from "next/link";
import { Pencil, Reply, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  ReviewComment,
  ReviewDiscussion as ReviewDiscussionData,
  ReviewVoteValue,
} from "@/lib/domain";
import { cn } from "@/lib/utils";

function formatCommentDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getAvatarFallback(name?: string | null) {
  const initial = name?.trim().charAt(0);
  return initial ? initial.toUpperCase() : "?";
}

function VoteButton({
  active,
  count,
  disabled,
  icon,
  onClick,
}: {
  active: boolean;
  count: number;
  disabled: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      aria-pressed={active}
      className={cn(
        "gap-2 px-6 py-3 h-auto",
        active && "border-foreground"
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
      variant={active ? "secondary" : "outline"}
    >
      {icon}
      <span className="font-bold">{count}</span>
    </Button>
  );
}

function CommentComposer({
  actionLabel,
  disabled,
  onCancel,
  onSubmit,
  pending,
  placeholder,
  value,
  onChange,
}: {
  actionLabel: string;
  disabled: boolean;
  onCancel?: () => void;
  onSubmit: () => void;
  pending: boolean;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <textarea
        className="min-h-28 w-full resize-y border border-border bg-surface-low px-4 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/30"
        disabled={pending}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        value={value}
      />
      <div className="flex flex-wrap gap-2">
        {onCancel ? (
          <Button disabled={pending} onClick={onCancel} type="button" variant="ghost">
            취소
          </Button>
        ) : null}
        <Button disabled={disabled || pending} onClick={onSubmit} type="button">
          {pending ? "처리 중..." : actionLabel}
        </Button>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  actionPending,
  activeEditId,
  activeReplyId,
  editDraft,
  replyDraft,
  onChangeEditDraft,
  onChangeReplyDraft,
  onDelete,
  onOpenEdit,
  onOpenReply,
  onSaveEdit,
  onSubmitReply,
  onCancelEdit,
  onCancelReply,
}: {
  comment: ReviewComment;
  actionPending: string | null;
  activeEditId: string | null;
  activeReplyId: string | null;
  editDraft: string;
  replyDraft: string;
  onChangeEditDraft: (value: string) => void;
  onChangeReplyDraft: (value: string) => void;
  onDelete: (commentId: string) => void;
  onOpenEdit: (comment: ReviewComment) => void;
  onOpenReply: (comment: ReviewComment) => void;
  onSaveEdit: (commentId: string) => void;
  onSubmitReply: (commentId: string) => void;
  onCancelEdit: () => void;
  onCancelReply: () => void;
}) {
  const isEditing = activeEditId === comment.id;
  const isReplying = activeReplyId === comment.id;
  const cannotChangeBecauseReplies = comment.isMine && comment.replyCount > 0 && !comment.canEdit;

  return (
    <div className="group space-y-4 py-4">
      <div className="flex items-start gap-4">
        <Avatar className="shrink-0" size="sm">
          {comment.author?.avatar ? <AvatarImage alt={comment.author.name} src={comment.author.avatar} /> : null}
          <AvatarFallback>{getAvatarFallback(comment.author?.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-foreground">{comment.author?.name ?? "익명"}</span>
            {comment.isReviewAuthor ? (
              <span className="border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                작성자
              </span>
            ) : null}
            <span className="text-[11px] text-muted-foreground">{formatCommentDate(comment.createdAt)}</span>
            {comment.updatedAt !== comment.createdAt ? (
              <span className="text-[11px] text-muted-foreground">수정됨</span>
            ) : null}
          </div>

          {isEditing ? (
            <CommentComposer
              actionLabel="댓글 수정"
              disabled={!editDraft.trim()}
              onCancel={onCancelEdit}
              onChange={onChangeEditDraft}
              onSubmit={() => onSaveEdit(comment.id)}
              pending={actionPending === `edit:${comment.id}`}
              placeholder="댓글을 수정하세요."
              value={editDraft}
            />
          ) : (
            <div className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">
              {comment.body}
            </div>
          )}

          {!isEditing ? (
            <div className="flex flex-wrap items-center gap-2">
              {comment.canReply ? (
                <Button onClick={() => onOpenReply(comment)} size="xs" type="button" variant="ghost">
                  <Reply className="size-3.5" />
                  답글
                </Button>
              ) : null}
              {comment.canEdit ? (
                <Button onClick={() => onOpenEdit(comment)} size="xs" type="button" variant="ghost">
                  <Pencil className="size-3.5" />
                  수정
                </Button>
              ) : null}
              {comment.canDelete ? (
                <Button
                  onClick={() => onDelete(comment.id)}
                  size="xs"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="size-3.5" />
                  삭제
                </Button>
              ) : null}
              {cannotChangeBecauseReplies ? (
                <span className="text-[11px] text-muted-foreground">답글이 있어 수정/삭제할 수 없습니다.</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {isReplying ? (
        <div className="border-l border-border pl-4">
          <CommentComposer
            actionLabel="답글 작성"
            disabled={!replyDraft.trim()}
            onCancel={onCancelReply}
            onChange={onChangeReplyDraft}
            onSubmit={() => onSubmitReply(comment.id)}
            pending={actionPending === `reply:${comment.id}`}
            placeholder="답글을 작성하세요."
            value={replyDraft}
          />
        </div>
      ) : null}

      {comment.replies.length ? (
        <div className="space-y-2 border-l-2 border-border/30 pl-4 md:pl-6 ml-2 md:ml-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              actionPending={actionPending}
              activeEditId={activeEditId}
              activeReplyId={activeReplyId}
              comment={reply}
              editDraft={editDraft}
              onCancelEdit={onCancelEdit}
              onCancelReply={onCancelReply}
              onChangeEditDraft={onChangeEditDraft}
              onChangeReplyDraft={onChangeReplyDraft}
              onDelete={onDelete}
              onOpenEdit={onOpenEdit}
              onOpenReply={onOpenReply}
              onSaveEdit={onSaveEdit}
              onSubmitReply={onSubmitReply}
              replyDraft={replyDraft}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ReviewDiscussion({ reviewId }: { reviewId: string }) {
  const discussion = useQuery("reviews:getDiscussion" as any, { reviewId }) as ReviewDiscussionData | null | undefined;
  const castVote = useMutation("reviews:castVote" as any);
  const addComment = useMutation("reviews:addComment" as any);
  const updateComment = useMutation("reviews:updateComment" as any);
  const deleteComment = useMutation("reviews:deleteComment" as any);
  const [rootDraft, setRootDraft] = React.useState("");
  const [replyDraft, setReplyDraft] = React.useState("");
  const [editDraft, setEditDraft] = React.useState("");
  const [activeReplyId, setActiveReplyId] = React.useState<string | null>(null);
  const [activeEditId, setActiveEditId] = React.useState<string | null>(null);
  const [actionPending, setActionPending] = React.useState<string | null>(null);
  const [deleteTargetCommentId, setDeleteTargetCommentId] = React.useState<string | null>(null);

  async function handleVote(value: ReviewVoteValue) {
    if (!discussion?.canVote) {
      return;
    }

    setActionPending(`vote:${value}`);
    try {
      const result = await castVote({ reviewId, value });
      if (result?.action === "removed") {
        toast.success(value === "recommend" ? "추천을 취소했습니다." : "비추천을 취소했습니다.");
      } else if (result?.action === "switched") {
        toast.success(value === "recommend" ? "추천으로 변경했습니다." : "비추천으로 변경했습니다.");
      } else {
        toast.success(value === "recommend" ? "추천을 남겼습니다." : "비추천을 남겼습니다.");
      }
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "투표에 실패했습니다.");
    } finally {
      setActionPending(null);
    }
  }

  async function handleCreateRootComment() {
    if (!rootDraft.trim()) {
      toast.error("댓글 내용을 입력하세요.");
      return;
    }

    setActionPending("root");
    try {
      await addComment({ reviewId, body: rootDraft });
      setRootDraft("");
      toast.success("댓글을 작성했습니다.");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "댓글 작성에 실패했습니다.");
    } finally {
      setActionPending(null);
    }
  }

  async function handleCreateReply(commentId: string) {
    if (!replyDraft.trim()) {
      toast.error("답글 내용을 입력하세요.");
      return;
    }

    setActionPending(`reply:${commentId}`);
    try {
      await addComment({ reviewId, body: replyDraft, parentCommentId: commentId });
      setReplyDraft("");
      setActiveReplyId(null);
      toast.success("답글을 작성했습니다.");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "답글 작성에 실패했습니다.");
    } finally {
      setActionPending(null);
    }
  }

  async function handleSaveEdit(commentId: string) {
    if (!editDraft.trim()) {
      toast.error("댓글 내용을 입력하세요.");
      return;
    }

    setActionPending(`edit:${commentId}`);
    try {
      await updateComment({ commentId, body: editDraft });
      setActiveEditId(null);
      setEditDraft("");
      toast.success("댓글을 수정했습니다.");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "댓글 수정에 실패했습니다.");
    } finally {
      setActionPending(null);
    }
  }

  async function handleDelete(commentId: string) {
    setActionPending(`delete:${commentId}`);
    try {
      await deleteComment({ commentId });
      toast.success("댓글을 삭제했습니다.");
      setDeleteTargetCommentId(null);
      if (activeEditId === commentId) {
        setActiveEditId(null);
        setEditDraft("");
      }
      if (activeReplyId === commentId) {
        setActiveReplyId(null);
        setReplyDraft("");
      }
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "댓글 삭제에 실패했습니다.");
    } finally {
      setActionPending(null);
    }
  }

  function openReply(comment: ReviewComment) {
    setActiveEditId(null);
    setEditDraft("");
    setActiveReplyId(comment.id);
    setReplyDraft("");
  }

  function openEdit(comment: ReviewComment) {
    setActiveReplyId(null);
    setReplyDraft("");
    setActiveEditId(comment.id);
    setEditDraft(comment.body);
  }

  if (discussion === undefined) {
    return (
      <section className="mt-16 space-y-12 border-t border-border pt-12">
        <div className="flex flex-col items-center justify-center">
          <div className="flex gap-2">
            <div className="h-12 w-24 animate-pulse bg-surface-high rounded" />
            <div className="h-12 w-24 animate-pulse bg-surface-high rounded" />
          </div>
        </div>
        <div className="space-y-8 pt-8">
          <div className="h-8 w-24 animate-pulse bg-surface-high rounded" />
          <div className="h-32 animate-pulse bg-surface-high rounded" />
          <div className="h-32 animate-pulse bg-surface-high rounded" />
        </div>
      </section>
    );
  }

  if (!discussion) {
    return null;
  }

  return (
    <>
      <AlertDialog
        open={Boolean(deleteTargetCommentId)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !actionPending?.startsWith("delete:")) {
            setDeleteTargetCommentId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>댓글을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 댓글은 삭제되며 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button disabled={actionPending?.startsWith("delete:")} type="button" variant="outline">
                취소
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                disabled={!deleteTargetCommentId || actionPending?.startsWith("delete:")}
                onClick={(event) => {
                  event.preventDefault();
                  if (deleteTargetCommentId) {
                    void handleDelete(deleteTargetCommentId);
                  }
                }}
                type="button"
                variant="destructive"
              >
                삭제
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <section className="mt-16 space-y-12 border-t border-border pt-12">
        <div className="flex flex-col items-center gap-4">
          <div className="flex justify-center gap-2">
            <VoteButton
              active={discussion.viewerVote === "recommend"}
              count={discussion.recommendCount}
              disabled={!discussion.canVote || actionPending === "vote:not_recommend" || actionPending === "vote:recommend"}
              icon={<ThumbsUp className="size-4" />}
              onClick={() => void handleVote("recommend")}
            />
            <VoteButton
              active={discussion.viewerVote === "not_recommend"}
              count={discussion.notRecommendCount}
              disabled={!discussion.canVote || actionPending === "vote:not_recommend" || actionPending === "vote:recommend"}
              icon={<ThumbsDown className="size-4" />}
              onClick={() => void handleVote("not_recommend")}
            />
          </div>
        </div>

        <div className="space-y-8 pt-8">
          <div className="flex items-center gap-4 border-b border-border pb-4">
            <h2 className="text-xl font-black uppercase tracking-[0.16em] text-foreground">댓글</h2>
            <span className="text-sm font-bold text-muted-foreground">{discussion.commentCount}</span>
          </div>

          <div className="space-y-10">
            <div className="space-y-4">
              {discussion.canComment ? (
                <CommentComposer
                  actionLabel="댓글 작성"
                  disabled={!rootDraft.trim()}
                  onChange={setRootDraft}
                  onSubmit={() => void handleCreateRootComment()}
                  pending={actionPending === "root"}
                  placeholder="댓글을 작성하세요."
                  value={rootDraft}
                />
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-low p-6">
                  <p className="text-sm text-muted-foreground">로그인한 사용자만 댓글을 작성할 수 있습니다.</p>
                  <Button asChild variant="outline">
                    <Link href="/login">로그인</Link>
                  </Button>
                </div>
              )}
            </div>

            {discussion.comments.length ? (
              <div className="space-y-6">
                {discussion.comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    actionPending={actionPending}
                    activeEditId={activeEditId}
                    activeReplyId={activeReplyId}
                    comment={comment}
                    editDraft={editDraft}
                    onCancelEdit={() => {
                      setActiveEditId(null);
                      setEditDraft("");
                    }}
                    onCancelReply={() => {
                      setActiveReplyId(null);
                      setReplyDraft("");
                    }}
                    onChangeEditDraft={setEditDraft}
                    onChangeReplyDraft={setReplyDraft}
                    onDelete={setDeleteTargetCommentId}
                    onOpenEdit={openEdit}
                    onOpenReply={openReply}
                    onSaveEdit={(commentId) => void handleSaveEdit(commentId)}
                    onSubmitReply={(commentId) => void handleCreateReply(commentId)}
                    replyDraft={replyDraft}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                아직 댓글이 없습니다.
              </div>
            )}

            {discussion.hasMore ? (
              <p className="text-xs text-muted-foreground pt-4 border-t border-border">
                최근 {discussion.comments.length}개 댓글만 표시 중입니다.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
