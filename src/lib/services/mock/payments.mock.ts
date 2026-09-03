import { sleep } from "@/lib/utils";
import { balancesSeed, earningsSeed, payoutMethodsSeed } from "@/lib/mock-data/finance.seed";
import { transactionsSeed } from "@/lib/mock-data/accounts.seed";
import type {
  Balances,
  EarningsEntry,
  PayoutMethod,
  PayoutMethodKind,
  PaymentService,
  Transaction,
} from "@/lib/services/types";

const LATENCY = 350;

type FieldRule = {
  key: string;
  label: string;
  required?: boolean;
  pattern?: RegExp;
  message?: string;
};

const fieldRules: Record<PayoutMethodKind, FieldRule[]> = {
  upi: [
    { key: "upiId", label: "UPI ID", required: true, pattern: /^[\w.\-]{2,}@[a-zA-Z]{2,}$/, message: "UPI ID must look like name@bank." },
    { key: "holderName", label: "Beneficiary name", required: true },
  ],
  bank: [
    { key: "holderName", label: "Account holder name", required: true },
    { key: "bankName", label: "Bank name", required: true },
    { key: "accountNumber", label: "Account number", required: true, pattern: /^\d{8,17}$/, message: "Account number must be 8-17 digits." },
    { key: "routing", label: "IFSC / SWIFT / Routing", required: true },
  ],
};

function maskIdentifier(kind: PayoutMethodKind, fields: Record<string, string>): string {
  const tail = (value: string, n = 4) => value.slice(-n);
  switch (kind) {
    case "upi": {
      const [local, domain] = fields.upiId.split("@");
      return `${local.slice(0, 2)}***@${domain}`;
    }
    case "bank":
      return `${fields.bankName} ****${tail(fields.accountNumber)}`;
  }
}

export class MockPaymentService implements PaymentService {
  private methods: PayoutMethod[] = payoutMethodsSeed.map((m) => ({ ...m }));
  private transactions: Transaction[] = transactionsSeed.map((t) => ({ ...t }));

  async getBalances(): Promise<Balances> {
    await sleep(LATENCY);
    return { ...balancesSeed };
  }

  async listTransactions(): Promise<Transaction[]> {
    await sleep(LATENCY);
    return this.transactions.map((t) => ({ ...t }));
  }

  async listPayoutMethods(): Promise<PayoutMethod[]> {
    await sleep(LATENCY);
    return this.methods.map((m) => ({ ...m }));
  }

  async savePayoutDetails(
    id: string,
    fields: Record<string, string>
  ): Promise<PayoutMethod> {
    await sleep(500);
    const target = this.methods.find((m) => m.id === id);
    if (!target) throw new Error("We could not find that payout method.");
    const rules = fieldRules[target.kind];
    for (const rule of rules) {
      const value = (fields[rule.key] ?? "").trim();
      if (rule.required && !value) {
        throw new Error(`${rule.label} is required.`);
      }
      if (value && rule.pattern && !rule.pattern.test(value)) {
        throw new Error(rule.message ?? `${rule.label} is not valid.`);
      }
      fields[rule.key] = value;
    }
    target.maskedIdentifier = maskIdentifier(target.kind, fields);
    return { ...target };
  }

  async setDefaultPayoutMethod(id: string): Promise<void> {
    await sleep(250);
    const target = this.methods.find((m) => m.id === id);
    if (!target) throw new Error("We could not find that payout method.");
    this.methods = this.methods.map((m) => ({ ...m, isDefault: m.id === id }));
  }

  async withdraw(amountMinor: number): Promise<void> {
    await sleep(700);
    if (amountMinor < balancesSeed.minimumWithdrawalMinor) {
      throw new Error("Withdrawals start at $50. Keep earning and try again soon.");
    }
    const now = new Date().toISOString();
    this.transactions.unshift({
      id: `tx-${Date.now()}`,
      date: now,
      description: "Withdrawal to default payout method",
      kind: "payout",
      amountMinor: -amountMinor,
      status: "processing",
      method: "bank",
      reference: `PO-${Math.floor(Math.random() * 90000 + 10000)}`,
    });
  }

  async listEarnings(): Promise<EarningsEntry[]> {
    await sleep(LATENCY);
    return earningsSeed.map((e) => ({ ...e }));
  }
}
