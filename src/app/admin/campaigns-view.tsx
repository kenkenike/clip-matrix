"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import type { Campaign } from "@/lib/services/types";
import { campaignService } from "@/lib/services";
import { useAsync } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { InitialTile } from "@/components/ui/avatar";
import { TableWrap, THead, Th, Tr, Td, TableEmpty } from "@/components/ui/table";
import { SkeletonTable, ErrorState } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { formatCurrency, formatDateShort, rateLabel } from "@/lib/format";

export function AdminCampaignsView() {
  const router = useRouter();
  const { data, loading, error, retry } = useAsync<Campaign[]>(() => campaignService.listCampaigns(), []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">Campaigns</h1>
          <p className="mt-1.5 text-sm text-muted">
            Cross-platform view of every brief running on the marketplace.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/campaigns/new")}>
          <Plus className="h-4 w-4" aria-hidden="true" /> New Campaign
        </Button>
      </div>

      <Card className="overflow-hidden">
        {loading && <SkeletonTable rows={5} cols={6} />}
        {error && <ErrorState message={error} onRetry={retry} />}
        {!loading && !error && (!data || data.length === 0) && (
          <EmptyState title="No campaigns yet." body="Campaigns will appear here once brands launch them." />
        )}
        {!loading && !error && data && data.length > 0 && (
          <TableWrap className="border-0 rounded-none">
              <THead>
                <Th>Campaign</Th>
                <Th>Category</Th>
                <Th>Status</Th>
                <Th>Creators</Th>
                <Th>Spend</Th>
                <Th>Rate</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </THead>
              <tbody>
                {data.map((campaign) => (
                  <Tr
                    key={campaign.id}
                    className="group cursor-pointer"
                    onClick={() => router.push(`/admin/campaigns/${campaign.id}`)}
                  >
                    <Td>
                      <span className="flex items-center gap-3">
                        <InitialTile label={campaign.brandInitial} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-fg">{campaign.name}</span>
                          <span className="block truncate text-xs text-muted">{campaign.brandName}</span>
                        </span>
                      </span>
                    </Td>
                    <Td className="text-muted">{campaign.category}</Td>
                    <Td>
                      <StatusBadge status={campaign.status} />
                    </Td>
                    <Td className="tabular-nums">{campaign.creatorCount.toLocaleString()}</Td>
                    <Td className="w-48">
                      <div className="flex justify-between text-xs tabular-nums">
                        <span className="text-fg">{formatCurrency(campaign.spentMinor, { cents: false })}</span>
                        <span className="text-faint">{formatCurrency(campaign.budgetMinor, { cents: false })}</span>
                      </div>
                      <ProgressBar
                        value={campaign.spentMinor}
                        max={Math.max(campaign.budgetMinor, 1)}
                        tone={campaign.spentMinor >= campaign.budgetMinor ? "warning" : "accent"}
                        className="mt-1.5"
                      />
                    </Td>
                    <Td>
                      <span className="text-xs font-semibold text-accent">
                        {rateLabel(campaign.ratePer100kMinor)}
                      </span>
                      <span className="block text-xs text-muted">
                        Ends {formatDateShort(campaign.endsAt)}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/campaigns/${campaign.id}/edit`);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-accent"
                      >
                        Edit <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </Td>
                  </Tr>
                ))}
                {data.length === 0 && <TableEmpty colSpan={7}>No campaigns found.</TableEmpty>}
              </tbody>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}
