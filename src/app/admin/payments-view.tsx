"use client";

import { useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { Banknote, Landmark, Smartphone } from "lucide-react";
import type { AdminPayout, PayoutMethodKind } from "@/lib/services/types";
import { adminService } from "@/lib/services";
import { useAsync } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableWrap, THead, Th, Tr, Td, TableEmpty } from "@/components/ui/table";
import { SkeletonTable, ErrorState } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDateShort } from "@/lib/format";

const methodMeta: Record<
  PayoutMethodKind,
  { label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }
> = {
  bank: { label: "Bank", icon: Landmark },
  upi: { label: "UPI", icon: Smartphone },
};

function MethodBadge({ method }: { method: PayoutMethodKind }) {
  const meta = methodMeta[method];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/5 px-2.5 py-0.5 text-xs font-medium text-muted">
      <meta.icon aria-hidden="true" className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

export function AdminPaymentsView() {
  const { toast } = useToast();
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const { data, loading, error, retry } = useAsync<AdminPayout[]>(() => adminService.listPayouts(), []);

  const pending = (data ?? []).filter((p) => p.status === "pending");
  const pendingSum = pending.reduce((sum, p) => sum + p.amountMinor, 0);

  const release = async (payout: AdminPayout) => {
    if (releasingId) return;
    setReleasingId(payout.id);
    try {
      await adminService.releasePayout(payout.id);
      toast(`Released ${formatCurrency(payout.amountMinor)} to ${payout.creatorName}.`, "success");
      retry();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not release payout.", "error");
    } finally {
      setReleasingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">Payments</h1>
        <p className="mt-1.5 text-sm text-muted">Creator withdrawal requests awaiting release.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Pending requests</p>
          <p className="mt-1.5 font-heading text-2xl font-bold tabular-nums text-fg sm:text-3xl">
            {data ? pending.length : "--"}
          </p>
          <p className="mt-1 text-xs text-muted">Awaiting manual release</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Pending sum</p>
          <p className="mt-1.5 font-heading text-2xl font-bold tabular-nums text-accent sm:text-3xl">
            {data ? formatCurrency(pendingSum) : "--"}
          </p>
          <p className="mt-1 text-xs text-muted">Next batch run Friday</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        {loading && <SkeletonTable rows={5} cols={7} />}
        {error && <ErrorState message={error} onRetry={retry} />}
        {!loading && !error && (!data || data.length === 0) && (
          <EmptyState title="No payouts queued." body="Creator withdrawal requests will appear here." />
        )}
        {!loading && !error && data && data.length > 0 && (
          <TableWrap className="border-0 rounded-none">
              <THead>
                <Th>Creator</Th>
                <Th>Payment details</Th>
                <Th>Amount</Th>
                <Th>Method</Th>
                <Th>Requested</Th>
                <Th>Status</Th>
                <Th className="text-right">Action</Th>
              </THead>
              <tbody>
                {data.map((payout) => (
                  <Tr key={payout.id}>
                    <Td className="font-medium text-fg">{payout.creatorName}</Td>
                    <Td className="font-mono text-xs text-muted">{payout.paymentDetail}</Td>
                    <Td className="font-semibold tabular-nums text-fg">
                      {formatCurrency(payout.amountMinor)}
                    </Td>
                    <Td>
                      <MethodBadge method={payout.method} />
                    </Td>
                    <Td className="text-muted">{formatDateShort(payout.requestedAt)}</Td>
                    <Td>
                      <StatusBadge status={payout.status} />
                    </Td>
                    <Td className="text-right">
                      {payout.status !== "paid" ? (
                        <Button
                          size="sm"
                          loading={releasingId === payout.id}
                          disabled={releasingId !== null}
                          onClick={() => release(payout)}
                        >
                          Release
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-faint">
                          <Banknote className="h-3.5 w-3.5" aria-hidden="true" /> Sent
                        </span>
                      )}
                    </Td>
                  </Tr>
                ))}
                {data.length === 0 && <TableEmpty colSpan={7}>No payouts found.</TableEmpty>}
              </tbody>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}
