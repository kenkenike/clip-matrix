"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/inputs";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const featureFlags = [
  {
    id: "auto_approve",
    label: "Auto-approve low-risk submissions",
    body: "Skip manual review for clips with fraud score under 15.",
  },
  {
    id: "instant_payouts",
    label: "Instant payouts",
    body: "Let creators withdraw without the standard holding period.",
  },
  {
    id: "fraud_autoflag",
    label: "Fraud auto-flagging",
    body: "Automatically move clips scoring above 60 into the fraud queue.",
  },
  {
    id: "brand_verification",
    label: "Enforced brand verification",
    body: "Require domain verification before a brand can launch campaigns.",
  },
];

const payoutSchedules = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly (Fridays)" },
  { value: "biweekly", label: "Every two weeks" },
  { value: "monthly", label: "Monthly" },
];

export function AdminSettingsView() {
  const { toast } = useToast();
  const [feePct, setFeePct] = useState("12");
  const [schedule, setSchedule] = useState("weekly");
  const [flags, setFlags] = useState<Record<string, boolean>>({
    auto_approve: true,
    instant_payouts: false,
    fraud_autoflag: true,
    brand_verification: true,
  });
  const [saving, setSaving] = useState(false);

  const save = () => {
    if (saving) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast("Platform settings saved.", "success");
    }, 400);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">Settings</h1>
        <p className="mt-1.5 text-sm text-muted">Marketplace-wide commercial configuration.</p>
      </div>

      <Card className="p-6">
        <h2 className="font-heading text-lg font-semibold text-fg">Commercial</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="platform-fee" hint="% of GMV">
              Platform fee
            </Label>
            <Input
              id="platform-fee"
              type="number"
              min={0}
              max={50}
              step="0.5"
              value={feePct}
              onChange={(e) => setFeePct(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="payout-schedule">Payout schedule</Label>
            <Select
              id="payout-schedule"
              ariaLabel="Payout schedule"
              options={payoutSchedules}
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <h2 className="border-b border-line px-6 py-4 font-heading text-lg font-semibold text-fg">
          Feature flags
        </h2>
        <ul className="divide-y divide-line">
          {featureFlags.map((flag) => (
            <li key={flag.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="text-sm font-medium text-fg">{flag.label}</p>
                <p className="mt-0.5 text-xs text-muted">{flag.body}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={flags[flag.id]}
                aria-label={flag.label}
                onClick={() => setFlags((prev) => ({ ...prev, [flag.id]: !prev[flag.id] }))}
                className={cn(
                  "relative h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors",
                  flags[flag.id] ? "border-accent bg-accent-dim" : "border-line bg-surface-alt"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all",
                    flags[flag.id] ? "left-[calc(100%-1.25rem)] bg-accent" : "left-1 bg-white/40"
                  )}
                />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Button onClick={save} loading={saving}>
        Save Changes
      </Button>
    </div>
  );
}
