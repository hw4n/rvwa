"use client";

import { useQuery } from "convex/react";
import { PlatformHeader } from "@/components/platform-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import type { ReviewLeaderboardEntry } from "@/lib/domain";

const LEADERBOARD_LIMIT = 50;

export function ReviewLeaderboardPage() {
  const leaderboardQuery = useQuery(api.users.reviewLeaderboard, {
    limit: LEADERBOARD_LIMIT,
  }) as ReviewLeaderboardEntry[] | undefined;
  const isLoading = leaderboardQuery === undefined;
  const leaderboard = leaderboardQuery ?? [];

  return (
    <div className="space-y-8">
      <PlatformHeader eyebrow="Leaderboard" title="리뷰 랭킹" variant="compact" />

      <section className="max-w-3xl rounded-xl border border-border bg-surface-low text-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16 text-center">순위</TableHead>
              <TableHead>이름</TableHead>
              <TableHead className="w-24 text-right">리뷰 수</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`leaderboard-row-skeleton-${index}`}>
                  <TableCell>
                    <div className="mx-auto h-5 w-5 animate-pulse rounded bg-surface-high" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 animate-pulse rounded bg-surface-high" />
                  </TableCell>
                  <TableCell>
                    <div className="ml-auto h-4 w-8 animate-pulse rounded bg-surface-high" />
                  </TableCell>
                </TableRow>
              ))
            ) : leaderboard.length ? (
              leaderboard.map((entry) => (
                <TableRow className={getLeaderboardRowClassName(entry.rank)} key={entry.userId}>
                  <TableCell className="text-center font-medium tabular-nums text-muted-foreground">
                    {entry.rank}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{entry.displayName}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-foreground">
                    {entry.reviewCount}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell className="py-10 text-center text-muted-foreground" colSpan={3}>
                  아직 집계할 리뷰가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}

function getLeaderboardRowClassName(rank: number) {
  if (rank === 1) {
    return "border-amber-300/25 bg-amber-500/10 hover:bg-amber-500/15";
  }

  if (rank === 2) {
    return "border-slate-300/20 bg-slate-400/10 hover:bg-slate-400/15";
  }

  if (rank === 3) {
    return "border-orange-300/20 bg-orange-500/10 hover:bg-orange-500/15";
  }

  return "";
}
