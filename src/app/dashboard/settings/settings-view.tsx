"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/inputs";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { creatorService } from "@/lib/services";

const toggles = [
  { id: "new_campaigns", label: "New campaign matches", body: "Alert me when a brief fits my platforms and style." },
  { id: "clip_status", label: "Clip status changes", body: "Approved, rejected, flagged - tell me the moment it happens." },
  { id: "payouts", label: "Payout events", body: "Confirmations for withdrawals and automatic payouts." },
  { id: "weekly_digest", label: "Weekly performance digest", body: "A Monday summary of views, earnings, and top clips." },
];

export function SettingsView() {
  const { toast } = useToast();
  const [name, setName] = useState("Alex Rivera");
  const [handle, setHandle] = useState("alexclips");
  const [bio, setBio] = useState(
    "Short-form editor turning long-form into scroll-stopping cuts. 12.4M views and counting."
  );
  const [errors, setErrors] = useState<{ name?: string; handle?: string }>({});
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    new_campaigns: true,
    clip_status: true,
    payouts: true,
    weekly_digest: false,
  });

  const saveProfile = async () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Name cannot be empty.";
    if (!/^[\w.]{2,30}$/.test(handle)) next.handle = "Use 2-30 letters, numbers, dots or underscores.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    try {
      await creatorService.getCurrentCreator();
      toast("Profile updated.", "success");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">Settings</h1>

      <Card className="p-6">
        <h2 className="font-heading text-lg font-semibold text-fg">Profile</h2>
        <div className="mt-5 flex items-center gap-4">
          <Avatar name={name} size="lg" />
          <div>
            <p className="text-sm font-medium text-fg">{name}</p>
            <p className="text-xs text-muted">@{handle}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="settings-name">Display name</Label>
            <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} />
            <FieldError message={errors.name} />
          </div>
          <div>
            <Label htmlFor="settings-handle" hint="Letters, numbers, dots">
              Handle
            </Label>
            <Input id="settings-handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
            <FieldError message={errors.handle} />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="settings-bio">Bio</Label>
          <Textarea id="settings-bio" value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <Button className="mt-5" onClick={saveProfile} loading={saving}>
          Save Changes
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <h2 className="border-b border-line px-6 py-4 font-heading text-lg font-semibold text-fg">
          Notifications
        </h2>
        <ul className="divide-y divide-line">
          {toggles.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="text-sm font-medium text-fg">{t.label}</p>
                <p className="mt-0.5 text-xs text-muted">{t.body}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled[t.id]}
                aria-label={t.label}
                onClick={() => setEnabled((prev) => ({ ...prev, [t.id]: !prev[t.id] }))}
                className={cn(
                  "relative h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors",
                  enabled[t.id] ? "border-accent bg-accent-dim" : "border-line bg-surface-alt"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all",
                    enabled[t.id] ? "left-[calc(100%-1.25rem)] bg-accent" : "left-1 bg-white/40"
                  )}
                />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
