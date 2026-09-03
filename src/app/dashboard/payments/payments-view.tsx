"use client";

import { useState } from "react";
import { Check, PencilLine, ShieldCheck } from "lucide-react";
import type { PayoutMethod, PayoutMethodKind } from "@/lib/services/types";
import { paymentService } from "@/lib/services";
import { useAsync } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { SkeletonCard, ErrorState } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Input, Label, FieldError } from "@/components/ui/inputs";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type DetailField = {
  key: string;
  label: string;
  placeholder: string;
  inputMode?: "numeric" | "email";
};

const detailFields: Record<PayoutMethodKind, DetailField[]> = {
  upi: [
    { key: "upiId", label: "UPI ID", placeholder: "yourname@bank" },
    { key: "holderName", label: "Beneficiary name", placeholder: "Name on the account" },
  ],
  bank: [
    { key: "holderName", label: "Account holder name", placeholder: "Full name" },
    { key: "bankName", label: "Bank name", placeholder: "e.g. HDFC, Chase" },
    { key: "accountNumber", label: "Account number", placeholder: "8-17 digits", inputMode: "numeric" },
    { key: "routing", label: "IFSC / SWIFT / Routing number", placeholder: "e.g. HDFC0000123" },
  ],
};

const NOT_SET_UP = "Not set up";

export function PaymentsView() {
  const { toast } = useToast();
  const { data, loading, error, retry } = useAsync<PayoutMethod[]>(() => paymentService.listPayoutMethods(), []);
  const balances = useAsync(() => paymentService.getBalances(), []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<PayoutMethod | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [savingDetail, setSavingDetail] = useState(false);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-64" />
      </div>
    );
  }
  if (error || !data) return <ErrorState message={error ?? "Something went wrong."} onRetry={retry} />;

  const currentDefault = data.find((m) => m.isDefault);
  const activeId = selectedId ?? currentDefault?.id ?? data[0]?.id;
  const editingFields = editing ? detailFields[editing.kind] : [];

  const openEditor = (method: PayoutMethod) => {
    setValues({});
    setFieldError(null);
    setEditing(method);
  };

  const saveDefault = async () => {
    if (!activeId || activeId === currentDefault?.id) return;
    setSaving(true);
    try {
      await paymentService.setDefaultPayoutMethod(activeId);
      toast("Default payout method updated.", "success");
      retry();
    } finally {
      setSaving(false);
    }
  };

  const saveDetails = async () => {
    if (!editing) return;
    setSavingDetail(true);
    setFieldError(null);
    try {
      await paymentService.savePayoutDetails(editing.id, values);
      toast("Payment details saved.", "success");
      setEditing(null);
      retry();
    } catch (err) {
      setFieldError(err instanceof Error ? err.message : "Could not save payment details.");
    } finally {
      setSavingDetail(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">Payments</h1>
        <p className="mt-1.5 text-sm text-muted">
          Next automatic payout:{" "}
          <span className="text-fg">
            {balances.data ? new Date(balances.data.nextPayoutDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "..."}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Available to withdraw</p>
          <p className="mt-1.5 font-heading text-2xl font-bold tabular-nums text-accent">
            {balances.data ? formatCurrency(balances.data.availableMinor) : "--"}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Minimum withdrawal</p>
          <p className="mt-1.5 font-heading text-2xl font-bold tabular-nums text-fg">
            {balances.data ? formatCurrency(balances.data.minimumWithdrawalMinor) : "--"}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <h2 className="border-b border-line px-5 py-4 font-heading text-base font-semibold text-fg">
          Payout methods
        </h2>
        <div role="radiogroup" aria-label="Payout methods" className="divide-y divide-line">
          {data.map((method) => {
            const selected = method.id === activeId;
            const needsSetup = method.maskedIdentifier === NOT_SET_UP;
            return (
              <div
                key={method.id}
                className={cn(
                  "flex items-center justify-between gap-3 px-5 py-4 transition-colors",
                  selected ? "bg-accent-dim/50" : "hover:bg-white/[0.03]"
                )}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setSelectedId(method.id)}
                  className="flex flex-1 cursor-pointer items-center gap-3.5 text-left"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                      selected ? "border-accent bg-accent" : "border-line-strong"
                    )}
                  >
                    {selected && <Check className="h-3 w-3 text-black" />}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-fg">{method.label}</span>
                    <span className={cn("text-xs tabular-nums", needsSetup ? "text-amber-400" : "text-muted")}>
                      {needsSetup ? "Payment details required before payout" : method.maskedIdentifier}
                    </span>
                  </span>
                </button>
                <span className="flex shrink-0 items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => openEditor(method)}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                      needsSetup
                        ? "border-accent/50 bg-accent-dim text-accent hover:brightness-125"
                        : "border-line bg-transparent text-muted hover:border-line-strong hover:text-fg"
                    )}
                  >
                    <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
                    {needsSetup ? "Add details" : "Edit"}
                  </button>
                  {method.isDefault && (
                    <span className="rounded-md border border-accent/40 bg-accent-dim px-2 py-0.5 text-[10px] font-semibold tracking-wider text-accent uppercase">
                      Default
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        <div className="border-t border-line p-5">
          <button
            type="button"
            onClick={saveDefault}
            disabled={saving || activeId === currentDefault?.id}
            className="cursor-pointer rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Set as default"}
          </button>
        </div>
      </Card>

      <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-alt p-5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-fg">Payments are protected</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Account identifiers are stored encrypted and never fully displayed. Clip Matrix will never
            ask for your password or full account number over email or chat.
          </p>
        </div>
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={`Payment details - ${editing?.label ?? ""}`}
        description="Details are encrypted and only shown masked once saved."
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="cursor-pointer rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-fg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveDetails}
              disabled={savingDetail}
              className="cursor-pointer rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingDetail ? "Saving..." : "Save details"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {editingFields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={`pd-${field.key}`}>{field.label}</Label>
              <Input
                id={`pd-${field.key}`}
                value={values[field.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                inputMode={field.inputMode}
                autoComplete="off"
              />
            </div>
          ))}
          <FieldError message={fieldError} />
        </div>
      </Modal>
    </div>
  );
}
