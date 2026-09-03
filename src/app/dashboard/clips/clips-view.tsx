"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { Clip, ClipStatus } from "@/lib/services/types";
import { creatorService } from "@/lib/services";
import { useAsync } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { PlatformIcon, platformLabel } from "@/components/ui/platform";
import {
  TableWrap,
  THead,
  Th,
  Tr,
  Td,
} from "@/components/ui/table";
import { SkeletonTable, ErrorState } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { formatCompact, formatDateShort, rateLabel } from "@/lib/format";

type FilterValue = ClipStatus | "all";

const filters: { id: FilterValue; label: string }[] = [
  { id: "all", label: "All" },
  { id: "paid", label: "Paid" },
  { id: "pending", label: "Pending" },
  { id: "under_review", label: "Under review" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

export function ClipsView() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [reasonClip, setReasonClip] = useState<Clip | null>(null);
  const { data, loading, error, retry } = useAsync<Clip[]>(() => creatorService.listMyClips(), []);

  const filtered = useMemo(
    () => (data ?? []).filter((c) => filter === "all" || c.status === filter),
    [data, filter]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">My Clips</h1>
        <p className="mt-1.5 text-sm text-muted">
          Every submission, its verification status, and what it earned.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={
              filter === f.id
                ? "cursor-pointer rounded-full border border-accent/40 bg-accent-dim px-3.5 py-1.5 text-xs font-semibold text-accent"
                : "cursor-pointer rounded-full border border-line bg-surface-alt px-3.5 py-1.5 text-xs font-medium text-muted transition-colors hover:text-fg"
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {loading && <SkeletonTable rows={6} cols={6} />}
        {error && <ErrorState message={error} onRetry={retry} />}
        {data && filtered.length === 0 && (
          <EmptyState
            title="No clips here yet."
            body="Join a campaign and submit your first clip to see it tracked in real time."
          />
        )}
        {data && filtered.length > 0 && (
          <TableWrap>
            <THead>
              <tr>
                <Th>Campaign</Th>
                <Th>Platform</Th>
                <Th>Views</Th>
                <Th>Earned</Th>
                <Th>Submitted</Th>
                <Th>Status</Th>
                <Th>Post</Th>
              </tr>
            </THead>
            <tbody>
              {filtered.map((clip) => (
                <Tr key={clip.id}>
                  <Td>
                    <span className="font-medium text-fg">{clip.campaignName}</span>
                    <span className="block text-xs text-muted">{clip.brandName}</span>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      <PlatformIcon platform={clip.platform} className="h-3.5 w-3.5" />
                      {platformLabel(clip.platform)}
                    </span>
                  </Td>
                  <Td className="tabular-nums">{formatCompact(clip.views)}</Td>
                  <Td className="font-medium tabular-nums text-accent">{rateLabel(clip.earnedMinor)}</Td>
                  <Td className="text-muted">{formatDateShort(clip.submittedAt)}</Td>
                  <Td>
                    <StatusBadge status={clip.status} />
                    {clip.status === "rejected" && clip.rejectionReason && (
                      <button
                        type="button"
                        onClick={() => setReasonClip(clip)}
                        className="mt-1.5 block cursor-pointer text-left text-xs font-medium text-red-400 transition-colors hover:text-red-300"
                      >
                        View reason
                      </button>
                    )}
                  </Td>
                  <Td>
                    <a
                      href={clip.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-accent"
                    >
                      Open <ExternalLink className="h-3 w-3" />
                    </a>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <Modal
        open={reasonClip !== null}
        onClose={() => setReasonClip(null)}
        title="Why your clip was rejected"
        description={
          reasonClip
            ? `${reasonClip.campaignName} - ${reasonClip.title ?? "your submission"}`
            : undefined
        }
      >
        {reasonClip?.rejectionReason && (
          <div className="space-y-4">
            <blockquote className="rounded-xl border border-red-500/25 bg-red-500/[0.05] p-4 text-sm leading-relaxed text-fg">
              {reasonClip.rejectionReason}
            </blockquote>
            <p className="text-xs leading-relaxed text-muted">
              You can re-edit the clip and submit a new version to the same campaign as long as it
              is still active and follows the campaign rules.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
