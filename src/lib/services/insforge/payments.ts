import { insforge } from "@/lib/insforge";
import type {
  Balances,
  EarningsEntry,
  PaymentService,
  PayoutMethod,
  Transaction,
} from "@/lib/services/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type DBRow = Record<string, any>;

export class InsforgePaymentService implements PaymentService {
  private getUserId(): string {
    if (typeof window === "undefined") return "usr-creator-01";
    const raw = window.localStorage.getItem("clipmatrix.session");
    if (!raw) return "usr-creator-01";
    try {
      return JSON.parse(raw)?.id ?? "usr-creator-01";
    } catch {
      return "usr-creator-01";
    }
  }

  async getBalances(): Promise<Balances> {
    const userId = this.getUserId();
    const { data: earnings } = await insforge.database
      .from("earnings")
      .select("amount_minor, status, created_at")
      .eq("user_id", userId);

    const all = earnings ?? [];
    const completed = all.filter((e: DBRow) => e.status === "completed");
    const pending = all.filter((e: DBRow) => e.status === "pending" || e.status === "processing");

    const now = new Date();
    const thisMonth = all.filter((e: DBRow) => {
      const d = new Date(e.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const nextPayout = new Date();
    nextPayout.setDate(nextPayout.getDate() + 7);

    return {
      availableMinor: completed.reduce((sum: number, e: DBRow) => sum + (e.amount_minor ?? 0), 0),
      pendingMinor: pending.reduce((sum: number, e: DBRow) => sum + (e.amount_minor ?? 0), 0),
      lifetimeMinor: all.reduce((sum: number, e: DBRow) => sum + (e.amount_minor ?? 0), 0),
      thisMonthMinor: thisMonth.reduce((sum: number, e: DBRow) => sum + (e.amount_minor ?? 0), 0),
      nextPayoutDate: nextPayout.toISOString(),
      minimumWithdrawalMinor: 500000,
    };
  }

  async listTransactions(): Promise<Transaction[]> {
    const userId = this.getUserId();
    const { data, error } = await insforge.database
      .from("transactions")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: DBRow) => ({
      id: r.id,
      date: r.created_at,
      description: r.description,
      kind: r.kind === "withdrawal" ? "payout" : r.kind === "bonus" ? "adjustment" : "earning",
      amountMinor: r.amount_minor,
      status: r.status as Transaction["status"],
      method: r.method === "upi" ? "upi" : "bank",
      reference: r.reference ?? "",
    }));
  }

  async listPayoutMethods(): Promise<PayoutMethod[]> {
    const userId = this.getUserId();
    const { data, error } = await insforge.database
      .from("payout_methods")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: DBRow) => ({
      id: r.id,
      kind: r.kind === "upi" ? "upi" : "bank",
      label: r.label,
      maskedIdentifier: r.identifier,
      isDefault: r.is_default ?? false,
      addedAt: r.created_at,
    }));
  }

  async savePayoutDetails(id: string, fields: Record<string, string>): Promise<PayoutMethod> {
    const userId = this.getUserId();
    const { data: existing } = await insforge.database
      .from("payout_methods")
      .select("id")
      .eq("id", id)
      .single();

    if (existing) {
      const { data, error } = await insforge.database
        .from("payout_methods")
        .update({ label: fields.label ?? "", identifier: fields.identifier ?? "" })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return {
        id: data.id,
        kind: data.kind === "upi" ? "upi" : "bank",
        label: data.label,
        maskedIdentifier: data.identifier,
        isDefault: data.is_default ?? false,
        addedAt: data.created_at,
      };
    }

    const { data, error } = await insforge.database
      .from("payout_methods")
      .insert([{
        user_id: userId,
        kind: fields.kind ?? "bank_transfer",
        label: fields.label ?? "",
        identifier: fields.identifier ?? "",
        is_default: false,
      }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      kind: data.kind === "upi" ? "upi" : "bank",
      label: data.label,
      maskedIdentifier: data.identifier,
      isDefault: data.is_default ?? false,
      addedAt: data.created_at,
    };
  }

  async setDefaultPayoutMethod(id: string): Promise<void> {
    const userId = this.getUserId();
    await insforge.database
      .from("payout_methods")
      .update({ is_default: false })
      .eq("user_id", userId);
    const { error } = await insforge.database
      .from("payout_methods")
      .update({ is_default: true })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async withdraw(amountMinor: number): Promise<void> {
    const userId = this.getUserId();
    const { error } = await insforge.database
      .from("payout_requests")
      .insert([{
        user_id: userId,
        amount_minor: amountMinor,
        method: "bank_transfer",
        payment_detail: "",
        status: "pending",
      }]);
    if (error) throw new Error(error.message);
  }

  async listEarnings(): Promise<EarningsEntry[]> {
    const userId = this.getUserId();
    const { data, error } = await insforge.database
      .from("earnings")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: DBRow) => ({
      id: r.id,
      date: r.created_at,
      campaignId: r.campaign_id,
      campaignName: r.campaign_name,
      views: r.views ?? 0,
      amountMinor: r.amount_minor ?? 0,
      status: r.status === "completed" ? "Paid" : r.status === "processing" ? "Processing" : "Pending",
      method: r.method === "upi" ? "upi" : "bank",
    }));
  }
}
