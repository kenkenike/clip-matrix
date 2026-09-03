"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Flag as FlagIcon, ShieldAlert } from "lucide-react";
import type { Clip, FraudSignal } from "@/lib/services/types";
import { adminService } from "@/lib/services";
import { useAsync } from "@/lib/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/inputs";
import { SkeletonCard, ErrorState } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatCompact, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

const signalMeta: Record<FraudSignal, { label: string; body: string }> = {
  view_velocity: {
    label: "View velocity",
    body: "Views per hour far above the creator's baseline.",
  },
  engagement_velocity: {
    label: "Engagement velocity",
    body: "Likes and comments spiking out of proportion to views.",
  },
  follower_view_ratio: {
    label: "Follower/view ratio",
    body: "Reach is implausible relative to follower count.",
  },
  duplicate_content: {
    label: "Duplicate content",
    body: "Media matches a previously submitted or public post.",
  },
  bot_like_engagement: {
    label: "Bot-like engagement",
    body: "Repetitive comment patterns from low-quality accounts.",
  },
  platform_api_verification: {
    label: "Platform API verification",
    body: "Post metrics could not be confirmed via platform API.",
  },
};

const levelTones = { LOW: "success", MEDIUM: "warning", HIGH: "danger" } as const;

const signalOrder: FraudSignal[] = [
  "view_velocity",
  "engagement_velocity",
  "follower_view_ratio",
  "duplicate_content",
  "bot_like_engagement",
  "platform_api_verification",
];

export function AdminFraudView() {
  const { toast } = useToast();
  const { data, loading, error, retry } = useAsync<Clip[]>(() => adminService.listFraudQueue(), []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const saveNote = async (clip: Clip) => {
    if (savingId) return;
    setSavingId(clip.id);
    try {
      await adminService.updateFraudNote(clip.id, notes[clip.id] ?? "");
      toast("Internal note saved.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not save note.", "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          Fraud Detection
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Risk scoring for submissions before payout release.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/5 p-4">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-muted">
          <span className="font-semibold text-fg">Internal only.</span> Scores and signals are
          confidential moderation tooling. Never share this page or its contents with creators or
          brands.
        </p>
      </div>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-24" />
          ))}
        </div>
      )}
      {error && <ErrorState message={error} onRetry={retry} />}
      {data && data.length === 0 && (
        <EmptyState
          title="Queue is clear."
          body="No submissions currently carry a fraud assessment."
        />
      )}

      {data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((clip) => {
            const assessment = clip.fraudScore;
            if (!assessment) return null;
            const open = expandedId === clip.id;
            return (
              <Card key={clip.id} className="overflow-hidden">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setExpandedId(open ? null : clip.id)}
                  className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">
                      {clip.title ?? clip.campaignName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {clip.creatorName} · {clip.campaignName} ·{" "}
                      {formatDateShort(clip.submittedAt)} · {formatCompact(clip.views)} views
                    </p>
                  </div>
                  <Badge tone={levelTones[assessment.level]}>{assessment.level}</Badge>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-fg">
                    Score: {assessment.score}/100
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted transition-transform duration-200",
                      open && "rotate-180"
                    )}
                  />
                </button>

                {open && (
                  <div className="border-t border-line px-5 py-4">
                    <p className="text-xs font-semibold tracking-wide text-faint uppercase">
                      Signal checklist
                    </p>
                    <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                      {signalOrder.map((signal) => {
                        const flagged = assessment.signals.includes(signal);
                        const meta = signalMeta[signal];
                        return (
                          <li
                            key={signal}
                            className={cn(
                              "flex items-start gap-2.5 rounded-xl border p-3",
                              flagged ? "border-red-500/30 bg-red-500/5" : "border-line bg-surface-alt"
                            )}
                          >
                            {flagged ? (
                              <FlagIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
                            ) : (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                            )}
                            <div className="min-w-0">
                              <p className={cn("text-xs font-semibold", flagged ? "text-red-300" : "text-fg")}>
                                {meta.label}
                                <span className={cn("ml-1.5 font-medium", flagged ? "text-red-400" : "text-emerald-400")}>
                                  {flagged ? "Flagged" : "Pass"}
                                </span>
                              </p>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{meta.body}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="mt-4">
                      <p className="mb-1.5 text-xs font-medium text-muted">Internal notes</p>
                      <Textarea
                        value={notes[clip.id] ?? assessment.note}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [clip.id]: e.target.value }))}
                        placeholder="Context for the fraud decision..."
                        aria-label={`Internal notes for ${clip.creatorHandle}`}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-3"
                        loading={savingId === clip.id}
                        onClick={() => saveNote(clip)}
                      >
                        Save note
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
