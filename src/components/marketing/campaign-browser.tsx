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
import { Button } from "@/components/ui/button";

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

const sortOptions = [
  { value: "rate_desc", label: "Highest payout" },
  { value: "newest", label: "Newest" },
  { value: "ending_soon", label: "Ending soon" },
  { value: "popular", label: "Most popular" },
];

export function CampaignBrowser() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("rate_desc");

  const filter: CampaignFilter = useMemo(
    () => ({
      search,
      category: category as CampaignFilter["category"],
      platform: platform as CampaignFilter["platform"],
      status: status as CampaignFilter["status"],
      sort: sort as CampaignFilter["sort"],
    }),
    [search, category, platform, status, sort]
  );

  const { data, loading, error, retry } = useAsync<Campaign[]>(
    () => campaignService.listCampaigns(filter),
    [search, category, platform, status, sort]
  );

  const hasFilters =
    search !== "" || category !== "all" || platform !== "all" || status !== "all";

  return (
    <div>
      <div className="flex flex-col gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search campaigns or brands..."
        />
        <FilterBar>
          <FilterSelect
            ariaLabel="Filter by category"
            value={category}
            onChange={setCategory}
            options={categoryOptions}
          />
          <FilterSelect
            ariaLabel="Filter by platform"
            value={platform}
            onChange={setPlatform}
            options={platformOptions}
          />
          <FilterSelect
            ariaLabel="Filter by status"
            value={status}
            onChange={setStatus}
            options={statusOptions}
          />
          <FilterSelect
            ariaLabel="Sort campaigns"
            value={sort}
            onChange={setSort}
            options={sortOptions}
            className="ml-auto"
          />
        </FilterBar>
      </div>

      <div className="mt-8">
        {loading && <SkeletonGrid count={6} />}
        {error && <ErrorState message={error} onRetry={retry} />}
        {data && data.length === 0 && (
          <EmptyState
            title="No campaigns match your filters."
            body="Try widening your search. New campaigns launch across every category every week."
            action={
              hasFilters ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                    setPlatform("all");
                    setStatus("all");
                  }}
                >
                  Reset filters
                </Button>
              ) : null
            }
          />
        )}
        {data && data.length > 0 && (
          <>
            <p className="mb-5 text-sm text-muted">
              {data.length} campaign{data.length === 1 ? "" : "s"} found
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} href="/signup" actionLabel="Join campaign" />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
