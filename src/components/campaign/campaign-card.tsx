import Link from "next/link";
import { ArrowRight, Clock, Users } from "lucide-react";
import type { Campaign } from "@/lib/services/types";
import { InitialTile } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { PlatformBadges } from "@/components/ui/platform";
import { formatCurrency, formatCompact, rateLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CampaignCard({
  campaign,
  href,
  actionLabel = "View campaign",
  onAction,
  className,
}: {
  campaign: Campaign;
  href?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <InitialTile label={campaign.brandName} size="md" />
          <div>
            <h3 className="font-heading text-base font-semibold text-fg">{campaign.name}</h3>
            <p className="text-xs text-muted">
              by {campaign.brandName} - {campaign.category}
            </p>
          </div>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-accent/25 bg-accent-dim px-3 py-2.5">
        <span className="font-heading text-lg font-bold text-accent">
          {rateLabel(campaign.ratePer100kMinor)}
        </span>
        <Badge tone="accent">min {formatCompact(campaign.minViews)} views</Badge>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{campaign.description}</p>

      <PlatformBadges platforms={campaign.platforms} className="mt-4" />

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {campaign.daysRemaining > 0 ? `${campaign.daysRemaining} days left` : "Final hours"}
        </span>
        <span>Budget {formatCurrency(campaign.budgetMinor, { cents: false })}</span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {campaign.creatorCount}
        </span>
      </div>

      <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-transform duration-150 group-hover:translate-x-0.5">
        {actionLabel}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </div>
    </>
  );

  const classes = cn(
    "card-hover-lift group flex h-full cursor-pointer flex-col rounded-none border border-line bg-surface p-5",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    );
  }
  return (
    <button onClick={onAction} className={cn(classes, "text-left")}>
      {body}
    </button>
  );
}
