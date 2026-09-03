"use client";

import { useState } from "react";
import { BadgeCheck, Link2, Loader2 } from "lucide-react";
import type { SocialAccount, SocialAccountStatus } from "@/lib/services/types";
import { creatorService } from "@/lib/services";
import { useAsync } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { PlatformIcon, platformLabel } from "@/components/ui/platform";
import { SkeletonCard, ErrorState } from "@/components/ui/skeleton";
import { formatCompact, formatDateShort } from "@/lib/format";

export function AccountsView() {
  const { data, loading, error, retry } = useAsync<SocialAccount[]>(
    () => creatorService.getSocialAccounts(),
    []
  );
  const [pending, setPending] = useState<string | null>(null);

  const connect = async (account: SocialAccount) => {
    setPending(account.id);
    try {
      await creatorService.setAccountStatus(account.platform, "connecting");
      await new Promise((r) => setTimeout(r, 900));
      await creatorService.setAccountStatus(account.platform, "verified");
      retry();
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          Connected Accounts
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Verified accounts let us reconcile views against platform APIs - no screenshots required.
        </p>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}
      {error && <ErrorState message={error} onRetry={retry} />}
      {data && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((account) => (
            <Card key={account.id} className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between">
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-alt text-fg">
                    <PlatformIcon platform={account.platform} className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-heading text-base font-semibold text-fg">
                      {platformLabel(account.platform)}
                    </span>
                    <span className="text-xs text-muted">
                      {account.username ? `@${account.username.replace(/^@/, "")}` : "Not linked"}
                    </span>
                  </span>
                </span>
                <StatusBadge status={account.status} />
              </div>

              {account.status === "verified" && (
                <div className="mt-auto space-y-1 text-sm text-muted">
                  <p className="inline-flex items-center gap-1.5">
                    <BadgeCheck className="h-4 w-4 text-accent" />
                    {formatCompact(account.followers)} followers
                  </p>
                  <p className="text-xs text-faint">
                    Connected {account.connectedAt ? formatDateShort(account.connectedAt) : "recently"}
                  </p>
                </div>
              )}

              {account.status === "not_connected" && (
                <button
                  onClick={() => connect(account)}
                  disabled={pending === account.id}
                  className="mt-auto inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-all hover:brightness-110 disabled:opacity-60"
                >
                  {pending === account.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4" /> Connect
                    </>
                  )}
                </button>
              )}

              {account.status === "connecting" && (
                <p className="mt-auto inline-flex items-center gap-2 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" /> Authorizing with{" "}
                  {platformLabel(account.platform)}...
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
