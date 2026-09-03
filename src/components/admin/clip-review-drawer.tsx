"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Flag as FlagIcon, Play } from "lucide-react";
import type { Clip, ClipStatus, ModerationReview } from "@/lib/services/types";
import { adminService } from "@/lib/services";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PlatformBadge, platformLabel } from "@/components/ui/platform";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea, FieldError } from "@/components/ui/inputs";
import { useToast } from "@/components/ui/toast";
import { formatCompact, formatDateShort } from "@/lib/format";

const actionToasts: Record<ModerationReview["action"], string> = {
  approve: "Submission approved.",
  reject: "Submission rejected.",
  flag: "Submission flagged for fraud review.",
  request_changes: "Changes requested from creator.",
};

const statusForAction: Record<ModerationReview["action"], ClipStatus> = {
  approve: "approved",
  reject: "rejected",
  flag: "flagged",
  request_changes: "under_review",
};

export function ClipReviewDrawer({
  clip,
  onClose,
  onReviewed,
}: {
  clip: Clip | null;
  onClose: () => void;
  onReviewed: (clipId: string, status: ClipStatus, note: string, rejectionReason?: string) => void;
}) {
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | undefined>();
  const [acting, setActing] = useState<ModerationReview["action"] | null>(null);

  useEffect(() => {
    setNotes(clip?.fraudScore?.note ?? "");
    setRejectReason(clip?.rejectionReason ?? "");
    setRejectError(undefined);
  }, [clip?.id]);

  const act = async (action: ModerationReview["action"]) => {
    if (!clip || acting) return;
    if (action === "reject" && !rejectReason.trim()) {
      setRejectError("Write a short rejection reason - the creator will see this.");
      return;
    }
    setActing(action);
    try {
      await adminService.reviewSubmission(clip.id, action, notes, rejectReason.trim());
      onReviewed(
        clip.id,
        statusForAction[action],
        notes.trim(),
        action === "reject" ? rejectReason.trim() : undefined
      );
      toast(actionToasts[action], "success");
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Action failed. Try again.", "error");
    } finally {
      setActing(null);
    }
  };

  return (
    <Drawer open={clip !== null} onClose={onClose} title="Submission detail">
      {clip && (
        <div className="space-y-5">
          <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface-alt">
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-dim text-accent">
                <Play className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="text-xs font-medium tracking-wide text-faint uppercase">
                {platformLabel(clip.platform)} preview unavailable internally
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-heading text-lg font-semibold text-fg">
              {clip.title ?? `${clip.campaignName} clip`}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <PlatformBadge platform={clip.platform} />
              <a
                href="#"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-accent"
              >
                View original post <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface-alt p-4">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">Creator</p>
            <div className="mt-2.5 flex items-center gap-3">
              <Avatar name={clip.creatorName} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{clip.creatorName}</p>
                <p className="truncate text-xs text-muted">{clip.creatorHandle}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface-alt p-4">
            <p className="text-xs font-semibold tracking-wide text-faint uppercase">Campaign</p>
            <p className="mt-2 text-sm font-semibold text-fg">{clip.campaignName}</p>
            <p className="text-xs text-muted">{clip.brandName}</p>
            <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
              {[
                ["Views", formatCompact(clip.views)],
                ["Likes", formatCompact(clip.likes)],
                ["Comments", formatCompact(clip.comments)],
                ["Shares", formatCompact(clip.shares)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white/[0.04] px-1 py-2">
                  <dt className="text-[10px] tracking-wide text-faint uppercase">{label}</dt>
                  <dd className="mt-0.5 text-xs font-semibold tabular-nums text-fg">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {clip.fraudScore && (
            <div className="rounded-xl border border-line bg-surface-alt p-4">
              <p className="text-xs font-semibold tracking-wide text-faint uppercase">Fraud risk</p>
              <p className="mt-2 text-sm font-semibold tabular-nums text-fg">
                {clip.fraudScore.level} - Score: {clip.fraudScore.score}/100
              </p>
            </div>
          )}

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">Moderation notes</p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal context for this decision..."
              aria-label="Moderation notes"
            />
          </div>

          <div className="rounded-xl border border-red-500/25 bg-red-500/[0.04] p-3.5">
            <p className="mb-1.5 text-xs font-medium text-muted">
              Rejection reason{" "}
              <span className="text-faint">(required to reject - visible to the creator)</span>
            </p>
            <Textarea
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectError) setRejectError(undefined);
              }}
              placeholder="e.g. Clip reuses another creator's footage without credit."
              aria-label="Rejection reason"
            />
            <FieldError message={rejectError} />
          </div>

          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={clip.status} />
            <p className="text-xs text-faint">Submitted {formatDateShort(clip.submittedAt)}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-line pt-4">
            <Button size="sm" onClick={() => act("approve")} loading={acting === "approve"} disabled={acting !== null}>
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => act("reject")}
              loading={acting === "reject"}
              disabled={acting !== null}
            >
              Reject
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => act("flag")}
              loading={acting === "flag"}
              disabled={acting !== null}
            >
              <FlagIcon className="h-3.5 w-3.5" /> Flag
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => act("request_changes")}
              loading={acting === "request_changes"}
              disabled={acting !== null}
            >
              Request Changes
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
