"use client";

import { useState } from "react";
import { CheckCircle2, Play } from "lucide-react";
import type { SocialPlatformName, DetectedPostMetrics } from "@/lib/services/types";
import { socialPlatformService, creatorService } from "@/lib/services";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/inputs";
import { PlatformIcon, platformLabel } from "@/components/ui/platform";
import { useToast } from "@/components/ui/toast";
import { formatCompact, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

const steps = ["Platform", "Clip URL", "Verify", "Confirm", "Done"];

export function SubmitClipLauncher({
  campaignId,
  campaignName,
  platforms,
}: {
  campaignId: string;
  campaignName: string;
  platforms: SocialPlatformName[];
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  return (
    <>
      <Button size="lg" className="w-full shrink-0 sm:w-auto" onClick={() => setOpen(true)}>
        <Play className="h-4 w-4" aria-hidden="true" /> Start Clipping
      </Button>
      <SubmitWizard
        open={open}
        campaignId={campaignId}
        campaignName={campaignName}
        platforms={platforms}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function SubmitWizard({
  open,
  campaignId,
  campaignName,
  platforms,
  onClose,
}: {
  open: boolean;
  campaignId: string;
  campaignName: string;
  platforms: SocialPlatformName[];
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState<SocialPlatformName | null>(null);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | undefined>();
  const [checking, setChecking] = useState(false);
  const [metrics, setMetrics] = useState<DetectedPostMetrics | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setStep(0);
    setPlatform(null);
    setUrl("");
    setUrlError(undefined);
    setMetrics(null);
    setSubmitting(false);
  };

  const finish = () => {
    toast("Your clip is now being tracked.", "success");
    onClose();
    setTimeout(reset, 200);
  };

  const detect = async () => {
    if (!platform) return;
    setChecking(true);
    try {
      const valid = await socialPlatformService.validateUrl(url.trim(), platform);
      if (!valid) {
        setUrlError(`That does not look like a ${platformLabel(platform)} post URL.`);
        return;
      }
      setUrlError(undefined);
      const detected = await socialPlatformService.detectPost(url.trim(), platform);
      setMetrics(detected);
      setStep(2);
    } finally {
      setChecking(false);
    }
  };

  const confirmSubmit = async () => {
    if (!platform) return;
    setSubmitting(true);
    try {
      await creatorService.submitClip({ campaignId, platform, url: url.trim() });
      setStep(4);
    } catch {
      toast("Submission failed. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const footer =
    step === 0 || step === 4 ? null : (
      <div className="flex w-full justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={submitting || checking || step === 3}
          className="cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-fg disabled:opacity-50"
        >
          Back
        </button>
        {step === 1 && (
          <Button type="button" onClick={detect} loading={checking} disabled={!url.trim()}>
            Detect Metrics
          </Button>
        )}
      </div>
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Submit Clip - ${campaignName}`}
      description={`Step ${Math.min(step + 1, 5)} of 5`}
      footer={footer}
    >
      <ol className="mb-6 flex items-center gap-1.5">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col gap-1.5">
            <span
              aria-hidden="true"
              className={cn("h-1.5 rounded-full transition-colors", i <= step ? "bg-accent" : "bg-white/10")}
            />
            <span
              className={cn(
                "text-[10px] font-medium tracking-wide uppercase",
                i <= step ? "text-accent" : "text-faint"
              )}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-2.5">
          <p className="text-sm text-muted">Where did you post your clip?</p>
          {platforms.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPlatform(p);
                setStep(1);
              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-alt p-3.5 text-left transition-colors hover:border-accent/40 hover:bg-white/5"
            >
              <PlatformIcon platform={p} className="h-5 w-5 text-fg" />
              <span className="text-sm font-medium text-fg">{platformLabel(p)}</span>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div>
          <Label htmlFor="clip-url" hint="Paste the full post URL">
            {platformLabel(platform ?? "tiktok")} clip URL
          </Label>
          <Input
            id="clip-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={`https://www.${platform ?? "tiktok"}.com/@you/video/...`}
          />
          <FieldError message={urlError} />
          <p className="mt-2 text-xs text-faint">
            We fetch public metrics automatically - no screenshots needed.
          </p>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="rounded-xl border border-line bg-surface-alt p-5">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Stat label="Views" value={metrics ? formatCompact(metrics.views) : "-"} />
              <Stat label="Likes" value={metrics ? formatCompact(metrics.likes) : "-"} />
              <Stat label="Comments" value={metrics ? formatCompact(metrics.comments) : "-"} />
              <Stat label="Shares" value={metrics ? formatCompact(metrics.shares) : "-"} />
              <Stat label="Posted" value={metrics ? formatDateShort(metrics.postedAt) : "-"} />
              <Stat label="Handle" value={metrics?.accountHandle ?? "-"} />
            </div>
            <p className="mt-4 truncate border-t border-line pt-3 text-xs text-faint">{url}</p>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            Metrics are pulled live and re-verified against the platform API at payout time.
          </p>
          <Button
            type="button"
            size="lg"
            className="mt-5 w-full"
            onClick={() => setStep(3)}
          >
            Looks Right - Continue
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="rounded-xl border border-line bg-surface-alt p-5">
          <p className="text-sm leading-relaxed text-muted">
            Ready to submit this clip to <span className="font-medium text-fg">{campaignName}</span>?
            Views will be tracked continuously and earnings accrue once the campaign minimum of
            views is verified.
          </p>
          <Button
            type="button"
            size="lg"
            className="mt-5 w-full"
            onClick={confirmSubmit}
            loading={submitting}
          >
            Confirm Submission
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="animate-success-pop py-6 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-accent" aria-hidden="true" />
          <p className="mt-4 font-heading text-lg font-bold text-fg">Clip submitted.</p>
          <p className="mt-1.5 text-sm text-muted">Your clip is now being tracked.</p>
          <Button type="button" className="mt-6" onClick={finish}>
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs tracking-wide text-faint uppercase">{label}</p>
      <p className="font-heading text-lg font-semibold tabular-nums text-fg">{value}</p>
    </div>
  );
}
