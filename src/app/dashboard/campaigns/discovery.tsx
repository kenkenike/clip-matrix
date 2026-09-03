"use client";

import { useMemo, useState } from "react";
import type { Campaign, CampaignFilter } from "@/lib/services/types";
import { campaignService } from "@/lib/services";
import { useAsync } from "@/lib/hooks";
import { SearchBar } from "@/components/ui/inputs";
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonGrid, ErrorState } from "@/components/ui/skeleton";

const categoryOptions = [
  { value: "all", label: "All categories" },
  ...["Podcast", "Gaming", "Music", "SaaS", "Ecommerce", "Finance", "Education", "Entertainment"].map(
    (c) => ({ value: c, label: c })
  ),
];

const platformOptions = [
  { value: "all", label: "All platforms" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Reels" },
  { value: "youtube", label: "Shorts" },
  { value: "x", label: "X" },
];

const statusOptions = [
  { value: "all", label: "Any status" },
  { value: "ACTIVE", label: "Active" },
  { value: "ENDING_SOON", label: "Ending soon" },
];

export function CampaignDiscovery() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("all");

  const filter: CampaignFilter = useMemo(
    () => ({
      search,
      category: category as CampaignFilter["category"],
      platform: platform as CampaignFilter["platform"],
      status: status as CampaignFilter["status"],
      sort: "rate_desc",
    }),
    [search, category, platform, status]
  );

  const { data, loading, error, retry } = useAsync<Campaign[]>(
    () => campaignService.listCampaigns(filter),
    [search, category, platform, status]
  );

  const hasFilters = search !== "" || category !== "all" || platform !== "all" || status !== "all";

  return (
    <div>
      <div className="flex flex-col gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search campaigns or brands..."
        />
        <FilterBar>
          <FilterSelect ariaLabel="Category" value={category} onChange={setCategory} options={categoryOptions} />
          <FilterSelect ariaLabel="Platform" value={platform} onChange={setPlatform} options={platformOptions} />
          <FilterSelect ariaLabel="Status" value={status} onChange={setStatus} options={statusOptions} />
        </FilterBar>
      </div>

      <div className="mt-8">
        {loading && <SkeletonGrid count={6} />}
        {error && <ErrorState message={error} onRetry={retry} />}
        {data && data.length === 0 && (
          <EmptyState
            title="Nothing matches right now."
            body="Loosen your filters or check back soon - new briefs land every day."
            action={
              hasFilters ? (
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                    setPlatform("all");
                    setStatus("all");
                  }}
                  className="cursor-pointer rounded-xl border border-line bg-surface-alt px-4 py-2 text-sm font-medium text-fg hover:bg-white/5"
                >
                  Reset filters
                </button>
              ) : null
            }
          />
        )}
        {data && data.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {data.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                href={`/dashboard/campaigns/${campaign.id}`}
                actionLabel="View details"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
