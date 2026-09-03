"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpDown, CalendarDays, Users, Eye } from "lucide-react";
import type { Campaign, Clip, ClipStatus } from "@/lib/services/types";
import { campaignService, adminService } from "@/lib/services";
import { useAsync } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { InitialTile } from "@/components/ui/avatar";
import { PlatformBadges } from "@/components/ui/platform";
import { ProgressBar } from "@/components/ui/progress";
import { MetricCard } from "@/components/ui/metric-card";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/inputs";
import { TableWrap, THead, Th, Tr, Td } from "@/components/ui/table";
import { SkeletonTable, SkeletonCard, ErrorState } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipReviewDrawer } from "@/components/admin/clip-review-drawer";
import { Avatar } from "@/components/ui/avatar";
import { formatCompact, formatCurrency, formatDateShort } from "@/lib/format";

type FilterValue = ClipStatus | "all";

const filters: FilterValue[] = [
  "all",
  "pending",
  "under_review",
  "approved",
  "rejected",
  "flagged",
  "paid",
];

const filterLabels: Record<FilterValue, string> = {
  all: "All",
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  flagged: "Flagged",
  paid: "Paid",
};

export function ModCampaignDetailView({ campaignId }: { campaignId: string }) {
  const {
    data: campaign,
    loading: campaignLoading,
    error: campaignError,
    retry: retryCampaign,
  } = useAsync<Campaign | null>(() => campaignService.getCampaign(campaignId), [campaignId]);

  const {
    data: clipsData,
    loading: clipsLoading,
    error: clipsError,
    retry: retryClips,
  } = useAsync<Clip[]>(() => adminService.listSubmissions({ status: "all", campaignId }), [campaignId]);

  const [rows, setRows] = useState<Clip[]>([]);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (clipsData) setRows(clipsData);
  }, [clipsData]);

  const stats = useMemo(() => {
    const awaiting = rows.filter(
      (c) => c.status === "pending" || c.status === "under_review"
    ).length;
    const flagged = rows.filter((c) => c.status === "flagged").length;
    const totalViews = rows.reduce((sum, c) => sum + c.views, 0);
    return { total: rows.length, awaiting, flagged, totalViews };
  }, [rows]);

  const filtered = useMemo(() => {
    const list = rows.filter((c) => filter === "all" || c.status === filter);
    return [...list].sort((a, b) => {
      const da = new Date(a.submittedAt).getTime();
      const db = new Date(b.submittedAt).getTime();
      return sort === "newest" ? db - da : da - db;
    });
  }, [rows, filter, sort]);

  const selected = selectedId ? (rows.find((c) => c.id === selectedId) ?? null) : null;

  const handleReviewed = (clipId: string, status: ClipStatus, note: string, rejectionReason?: string) => {
    setRows((prev) =>
      prev.map((c) =>
        c.id === clipId
          ? {
              ...c,
              status,
              rejectionReason,
              fraudScore: note
                ? {
                    score: c.fraudScore?.score ?? 10,
                    level: c.fraudScore?.level ?? "LOW",
                    signals: c.fraudScore?.signals ?? [],
                    note,
                  }
                : c.fraudScore,
            }
          : c
      )
    );
  };

  if (campaignError) {
    return (
      <div className="mx-auto max-w-7xl">
        <ErrorState message={campaignError} onRetry={retryCampaign} />
      </div>
    );
  }

  if (campaignLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <SkeletonCard className="h-44" />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-24" />
          ))}
        </div>
        <SkeletonCard className="h-72" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <Link
          href="/mod/campaigns"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All campaigns
        </Link>
        <EmptyState
          title="Campaign not found."
          body="This campaign may have been removed or the link is incorrect."
        />
      </div>
    );
  }

  const budgetPct = Math.min(
    100,
    Math.round((campaign.spentMinor / Math.max(campaign.budgetMinor, 1)) * 100)
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        href="/mod/campaigns"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All campaigns
      </Link>

      <Card className="p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <InitialTile label={campaign.brandInitial} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-2xl font-bold tracking-tight text-fg">
                  {campaign.name}
                </h1>
                <StatusBadge status={campaign.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
                <span>{campaign.category}</span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" /> Ends in {campaign.daysRemaining} days
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {campaign.creatorCount.toLocaleString()} creators
                </span>
                <span className="font-semibold text-accent tabular-nums">
                  {formatCurrency(campaign.ratePer100kMinor)} / 100K
                </span>
              </div>
              <div className="mt-4">
                <PlatformBadges platforms={campaign.platforms} />
              </div>
            </div>
          </div>
          <div className="w-full max-w-xs lg:w-64">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-muted">
                {formatCurrency(campaign.spentMinor)} spent of{" "}
                {formatCurrency(campaign.budgetMinor)}
              </span>
              <span className="tabular-nums text-faint">{budgetPct}%</span>
            </div>
            <ProgressBar
              value={campaign.spentMinor}
              max={Math.max(campaign.budgetMinor, 1)}
              tone={campaign.spentMinor >= campaign.budgetMinor ? "warning" : "accent"}
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard label="Clip Submissions" value={stats.total} countUp icon={<Eye className="h-4 w-4" />} />
        <MetricCard label="Awaiting Review" value={stats.awaiting} countUp />
        <MetricCard label="Flagged" value={stats.flagged} countUp />
        <MetricCard label="Clip Views" value={stats.totalViews} compact countUp />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-base font-semibold text-fg">Clips for this campaign</h2>
            <p className="mt-0.5 text-xs text-muted">
              Review submissions sorted by this campaign. Click a row to open the review drawer.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            variant="pill"
            tabs={filters.map((f) => ({ id: f, label: `${filterLabels[f]}${f === "all" ? ` (${stats.total})` : ""}` }))}
            active={filter}
            onChange={(id) => setFilter(id as FilterValue)}
            className="max-w-full overflow-x-auto"
          />
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-faint" aria-hidden="true" />
            <Select
              ariaLabel="Sort clips"
              options={[
                { value: "newest", label: "Newest first" },
                { value: "oldest", label: "Oldest first" },
              ]}
              value={sort}
              onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
              className="w-40"
            />
          </div>
        </div>

        {clipsLoading && (
          <div className="pt-4">
            <SkeletonTable rows={5} cols={5} />
          </div>
        )}
        {clipsError && (
          <div className="pt-4">
            <ErrorState message={clipsError} onRetry={retryClips} />
          </div>
        )}
        {!clipsLoading && !clipsError && filtered.length === 0 && (
          <div className="py-2">
            <EmptyState
              title="No submissions here yet."
              body="Creator submissions for this status will appear in this queue."
            />
          </div>
        )}
        {!clipsLoading && !clipsError && filtered.length > 0 && (
          <TableWrap className="border-0 rounded-none">
            <THead>
              <Th>Submission</Th>
              <Th>Platform</Th>
              <Th>Views</Th>
              <Th>Earned</Th>
              <Th>Submitted</Th>
              <Th>Status</Th>
            </THead>
            <tbody>
              {filtered.map((clip) => (
                <Tr
                  key={clip.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(clip.id)}
                >
                  <Td>
                    <span className="flex items-center gap-3">
                      <InitialTile label={clip.title ?? clip.campaignName} size="sm" />
                      <span className="min-w-0">
                        <span className="block max-w-64 truncate font-medium text-fg">
                          {clip.title ?? `${clip.campaignName} clip`}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                          <Avatar name={clip.creatorName} size="xs" />
                          {clip.creatorHandle}
                        </span>
                      </span>
                    </span>
                  </Td>
                  <Td className="text-muted capitalize">{clip.platform}</Td>
                  <Td className="tabular-nums">{formatCompact(clip.views)}</Td>
                  <Td className="tabular-nums">{formatCurrency(clip.earnedMinor)}</Td>
                  <Td className="text-muted">{formatDateShort(clip.submittedAt)}</Td>
                  <Td>
                    <StatusBadge status={clip.status} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <ClipReviewDrawer
        clip={selected}
        onClose={() => setSelectedId(null)}
        onReviewed={handleReviewed}
      />
    </div>
  );
}
