"use client";

import { useState } from "react";
import { FileBarChart, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/inputs";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

const reportTypes = [
  { value: "gmv", label: "GMV and revenue" },
  { value: "payouts", label: "Payout ledger" },
  { value: "moderation", label: "Moderation activity" },
  { value: "fraud", label: "Fraud flags" },
  { value: "growth", label: "User growth" },
];

const months = [
  { value: "2026-01", label: "January 2026" },
  { value: "2026-02", label: "February 2026" },
  { value: "2026-03", label: "March 2026" },
  { value: "2026-04", label: "April 2026" },
  { value: "2026-05", label: "May 2026" },
  { value: "2026-06", label: "June 2026" },
  { value: "2026-07", label: "July 2026" },
  { value: "2026-08", label: "August 2026" },
];

export function AdminReportsView() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("gmv");
  const [from, setFrom] = useState("2026-06");
  const [to, setTo] = useState("2026-08");

  const exportCsv = () => {
    toast("Report export queued. You will be notified when it is ready.", "success");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">Reports</h1>
        <p className="mt-1.5 text-sm text-muted">
          Slice platform data by date range and export for finance or compliance.
        </p>
      </div>

      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="report-type">Report type</Label>
            <Select
              id="report-type"
              ariaLabel="Report type"
              options={reportTypes}
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="report-from">From</Label>
            <Select
              id="report-from"
              ariaLabel="Range start"
              options={months}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="report-to">To</Label>
            <Select
              id="report-to"
              ariaLabel="Range end"
              options={months}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
        <Button className="mt-5" onClick={exportCsv}>
          <FileDown className="h-4 w-4" aria-hidden="true" /> Export CSV
        </Button>
      </Card>

      <EmptyState
        icon={<FileBarChart className="h-5 w-5" aria-hidden="true" />}
        title="No reports generated yet."
        body="Pick a report type and date range above, then export to receive a CSV in your inbox."
      />
    </div>
  );
}
