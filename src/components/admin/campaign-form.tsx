"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Image as ImageIcon } from "lucide-react";
import type { Campaign, CampaignCategory, NewCampaignInput, SocialPlatformName, UpdateCampaignInput } from "@/lib/services/types";
import { campaignService } from "@/lib/services";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/inputs";

const CATEGORIES: { value: CampaignCategory; label: string }[] = [
  { value: "Podcast", label: "Podcast" },
  { value: "Gaming", label: "Gaming" },
  { value: "Music", label: "Music" },
  { value: "SaaS", label: "SaaS" },
  { value: "Ecommerce", label: "Ecommerce" },
  { value: "Finance", label: "Finance" },
  { value: "Education", label: "Education" },
  { value: "Entertainment", label: "Entertainment" },
];

const PLATFORMS: { value: SocialPlatformName; label: string }[] = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "x", label: "X" },
];

function parseList(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function centsToDollars(cents: number): string {
  return cents > 0 ? String(cents / 100) : "";
}

function dollarsToCents(dollars: string): number {
  const n = parseFloat(dollars);
  return isNaN(n) ? 0 : Math.round(n * 100);
}

interface CampaignFormProps {
  mode: "create" | "edit";
  initial?: Campaign;
  campaignId?: string;
}

export function CampaignForm({ mode, initial, campaignId }: CampaignFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<CampaignCategory>(initial?.category ?? "Entertainment");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [platforms, setPlatforms] = useState<SocialPlatformName[]>(initial?.platforms ?? ["tiktok"]);
  const [budget, setBudget] = useState(centsToDollars(initial?.budgetMinor ?? 100000));
  const [ratePer100k, setRatePer100k] = useState(centsToDollars(initial?.ratePer100kMinor ?? 5000));
  const [maxPayout, setMaxPayout] = useState(centsToDollars(initial?.maxPayoutMinor ?? 2500));
  const [minViews, setMinViews] = useState(initial?.minViews?.toString() ?? "1000");
  const [durationDays, setDurationDays] = useState("30");
  const [hashtags, setHashtags] = useState(initial?.requiredHashtags?.join(", ") ?? "");
  const [mentions, setMentions] = useState(initial?.requiredMentions?.join(", ") ?? "");
  const [phrases, setPhrases] = useState(initial?.requiredPhrases?.join(", ") ?? "");
  const [forbidden, setForbidden] = useState(initial?.prohibitedContent?.join("\n") ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const togglePlatform = (p: SocialPlatformName) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Campaign name is required.";
    if (!description.trim()) e.description = "Add a brief description.";
    if (platforms.length === 0) e.platforms = "Select at least one platform.";
    const b = dollarsToCents(budget);
    if (b < 10000) e.budget = "Minimum budget is $100.";
    const r = dollarsToCents(ratePer100k);
    if (r < 100) e.ratePer100k = "Set a rate per 100K views.";
    if (mode === "create") {
      const d = parseInt(durationDays, 10);
      if (isNaN(d) || d < 1) e.durationDays = "Duration must be at least 1 day.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setError(null);
    try {
      if (mode === "create") {
        const input: NewCampaignInput = {
          name: name.trim(),
          category,
          description: description.trim(),
          durationDays: parseInt(durationDays, 10) || 30,
          platforms,
          requiredPhrases: parseList(phrases),
          requiredHashtags: parseList(hashtags),
          requiredMentions: parseList(mentions),
          minCreatorFollowers: 0,
          forbiddenContent: forbidden,
          budgetMinor: dollarsToCents(budget),
          ratePer1kMinor: Math.round(dollarsToCents(ratePer100k) / 100),
          ratePer100kMinor: dollarsToCents(ratePer100k),
          maxPayoutMinor: dollarsToCents(maxPayout),
          minViews: parseInt(minViews, 10) || 1000,
        };
        await campaignService.createCampaign(input);
        router.push("/admin/campaigns");
      } else {
        if (!campaignId) throw new Error("Missing campaign ID.");
        const input: UpdateCampaignInput = {
          name: name.trim(),
          category,
          description: description.trim(),
          platforms,
          requiredPhrases: parseList(phrases),
          requiredHashtags: parseList(hashtags),
          requiredMentions: parseList(mentions),
          forbiddenContent: forbidden,
          budgetMinor: dollarsToCents(budget),
          ratePer100kMinor: dollarsToCents(ratePer100k),
          maxPayoutMinor: dollarsToCents(maxPayout),
          minViews: parseInt(minViews, 10) || 1000,
          coverUrl: coverUrl.trim() || undefined,
        };
        await campaignService.updateCampaign(campaignId, input);
        router.push(`/admin/campaigns/${campaignId}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
      </button>

      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {mode === "create" ? "New Campaign" : "Edit Campaign"}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {mode === "create"
            ? "Launch a new campaign for creators to submit clips."
            : `Update details for ${initial?.name ?? "this campaign"}.`}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Card className="space-y-6 p-5 sm:p-7">
        <div>
          <Label htmlFor="cover">Campaign cover image</Label>
          <div className="mt-1.5 flex items-start gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-alt">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Campaign cover"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-faint" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Input
                id="cover"
                placeholder="Paste an image URL"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
              />
              <p className="text-xs text-faint">
                Paste a direct URL to an image (JPG, PNG, or WebP). This will be displayed as the campaign thumbnail.
              </p>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="name">Campaign name</Label>
          <Input
            id="name"
            placeholder="e.g. Summer Drop 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <FieldError message={errors.name} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              ariaLabel="Category"
              options={CATEGORIES}
              value={category}
              onChange={(e) => setCategory(e.target.value as CampaignCategory)}
            />
          </div>
          {mode === "create" && (
            <div>
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                error={errors.durationDays}
              />
              <FieldError message={errors.durationDays} />
            </div>
          )}
        </div>

        <div>
          <Label>Platforms</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const active = platforms.includes(p.value);
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => togglePlatform(p.value)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-accent/50 bg-accent-dim text-accent"
                      : "border-line bg-surface-alt text-muted hover:border-white/25 hover:text-fg"
                  }`}
                >
                  {active && <Check className="h-3 w-3" aria-hidden="true" />}
                  {p.label}
                </button>
              );
            })}
          </div>
          <FieldError message={errors.platforms} />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="What is this campaign about? What kind of clips are you looking for?"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
          />
          <FieldError message={errors.description} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="budget" hint="USD">Budget</Label>
            <Input
              id="budget"
              type="number"
              min="0"
              step="100"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              error={errors.budget}
            />
            <FieldError message={errors.budget} />
          </div>
          <div>
            <Label htmlFor="rate" hint="USD / 100K views">Rate per 100K</Label>
            <Input
              id="rate"
              type="number"
              min="0"
              step="5"
              value={ratePer100k}
              onChange={(e) => setRatePer100k(e.target.value)}
              error={errors.ratePer100k}
            />
            <FieldError message={errors.ratePer100k} />
          </div>
          <div>
            <Label htmlFor="maxPayout" hint="USD / clip">Max payout per clip</Label>
            <Input
              id="maxPayout"
              type="number"
              min="0"
              step="5"
              value={maxPayout}
              onChange={(e) => setMaxPayout(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="minViews" hint="views">Minimum views threshold</Label>
          <Input
            id="minViews"
            type="number"
            min="0"
            step="100"
            value={minViews}
            onChange={(e) => setMinViews(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="hashtags" hint="comma separated">Required hashtags</Label>
            <Textarea
              id="hashtags"
              placeholder="#summer, #drop"
              rows={2}
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="mentions" hint="comma separated">Required mentions</Label>
            <Textarea
              id="mentions"
              placeholder="@brand, @product"
              rows={2}
              value={mentions}
              onChange={(e) => setMentions(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="phrases" hint="comma separated">Required phrases</Label>
            <Textarea
              id="phrases"
              placeholder="link in bio, shop now"
              rows={2}
              value={phrases}
              onChange={(e) => setPhrases(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="forbidden" hint="one per line">Prohibited content</Label>
          <Textarea
            id="forbidden"
            placeholder="No profanity&#10;No competitor mentions&#10;No misleading claims"
            rows={3}
            value={forbidden}
            onChange={(e) => setForbidden(e.target.value)}
          />
        </div>
      </Card>

      <div className="flex justify-end gap-3 pb-8">
        <Button variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button loading={saving} onClick={handleSubmit}>
          {mode === "create" ? "Create Campaign" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
