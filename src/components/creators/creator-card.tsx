import { Avatar } from "@/components/ui/avatar";
import type { CreatorProfile } from "@/lib/services/types";
import { formatCompact, formatCurrency } from "@/lib/format";

export function CreatorCard({ creator, rank }: { creator: CreatorProfile; rank?: number }) {
  return (
    <div className="card-hover-lift rounded-none border border-line bg-surface p-5">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar name={creator.displayName} size="lg" />
          {rank !== undefined && rank <= 3 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-accent/40 bg-background font-heading text-xs font-bold text-accent">
              {rank}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-heading text-base font-semibold text-fg">{creator.displayName}</h3>
          <p className="text-xs text-muted">{creator.handle}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
        <div>
          <dt className="text-[10px] tracking-wide text-faint uppercase">Views</dt>
          <dd className="mt-0.5 font-heading text-sm font-bold text-fg tabular-nums">
            {formatCompact(creator.totalViews)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-wide text-faint uppercase">Followers</dt>
          <dd className="mt-0.5 font-heading text-sm font-bold text-fg tabular-nums">
            {formatCompact(creator.followers)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-wide text-faint uppercase">Earned</dt>
          <dd className="mt-0.5 font-heading text-sm font-bold text-accent tabular-nums">
            {formatCurrency(creator.lifetimeEarningsMinor, { cents: false })}
          </dd>
        </div>
      </dl>
    </div>
  );
}
