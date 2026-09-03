import type { Campaign } from "@/lib/services/types";
import { campaignsSeed } from "@/lib/mock-data/campaign-builder.seed";

const STORAGE_KEY = "clipmatrix.deletedCampaignIds";

function loadDeletedIds(): Set<string> {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set<string>(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set<string>();
  }
}

function persistDeletedIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore storage failures (e.g. private mode)
  }
}

export const allCampaigns: Campaign[] = campaignsSeed.map((c) => ({ ...c }));

export function removeCampaign(campaignId: string): void {
  const idx = allCampaigns.findIndex((c) => c.id === campaignId);
  if (idx !== -1) allCampaigns.splice(idx, 1);
  const ids = loadDeletedIds();
  ids.add(campaignId);
  persistDeletedIds(ids);
}

export function visibleCampaigns(): Campaign[] {
  const ids = loadDeletedIds();
  if (ids.size === 0) return allCampaigns;
  return allCampaigns.filter((c) => !ids.has(c.id));
}

export function isCampaignVisible(campaignId: string): boolean {
  return !loadDeletedIds().has(campaignId);
}
