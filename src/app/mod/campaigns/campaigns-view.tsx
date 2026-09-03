"use client";

import { useRouter } from "next/navigation";
import type { Campaign } from "@/lib/services/types";
import { campaignService } from "@/lib/services";
import { useAsync } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { InitialTile } from "@/components/ui/avatar";
import { TableWrap, THead, Th, Tr, Td } from "@/components/ui/table";
import { SkeletonTable, ErrorState } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { formatCurrency, formatDateShort, rateLabel } from "@/lib/format";

export function ModCampaignsView() {
  const router = useRouter();
  const { data, loading, error, retry } = useAsync<Campaign[]>(() => campaignService.listCampaigns(), []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">Campaigns</h1>
        <p className="mt-1.5 text-sm text-muted">
          Browse active campaigns and review their clip submissions.
        </p>
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
            </THead>
            <tbody>
              {data.map((campaign) => (
                <Tr
                  key={campaign.id}
                  className="group cursor-pointer"
                  onClick={() => router.push(`/mod/campaigns/${campaign.id}`)}
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
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}
