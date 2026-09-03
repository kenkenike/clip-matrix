"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import type { Clip, ClipStatus } from "@/lib/services/types";
import { adminService } from "@/lib/services";
import { useAsync } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar, InitialTile } from "@/components/ui/avatar";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/inputs";
import { TableWrap, THead, Th, Tr, Td } from "@/components/ui/table";
import { SkeletonTable, ErrorState } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipReviewDrawer } from "@/components/admin/clip-review-drawer";
import { formatCompact, formatDateShort } from "@/lib/format";

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

export function AdminSubmissionsView() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [rows, setRows] = useState<Clip[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, loading, error, retry } = useAsync<Clip[]>(
    () => adminService.listSubmissions({ status: "all" }),
    []
  );

  useEffect(() => {
    if (data) setRows(data);
  }, [data]);

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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          Submissions
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Review queue for every clip entering the payout pipeline.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          variant="pill"
          tabs={filters.map((f) => ({ id: f, label: filterLabels[f] }))}
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

      <Card className="overflow-hidden">
        {loading && <SkeletonTable rows={6} cols={5} />}
        {error && <ErrorState message={error} onRetry={retry} />}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            title="Nothing in this queue."
            body="No submissions match the selected status right now."
          />
        )}
        {!loading && !error && filtered.length > 0 && (
          <TableWrap className="border-0 rounded-none">
            <THead>
              <Th>Submission</Th>
              <Th>Campaign</Th>
              <Th>Views</Th>
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
                          <span className="block max-w-72 truncate font-medium text-fg">
                            {clip.title ?? `${clip.campaignName} clip`}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                            <Avatar name={clip.creatorName} size="xs" />
                            {clip.creatorHandle}
                          </span>
                        </span>
                      </span>
                    </Td>
                    <Td>
                      <span className="font-medium text-fg">{clip.campaignName}</span>
                      <span className="block text-xs text-muted">{clip.brandName}</span>
                    </Td>
                    <Td className="tabular-nums">{formatCompact(clip.views)}</Td>
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
