"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-none border border-red-500/30 bg-red-500/10">
        <AlertTriangle className="h-7 w-7 text-red-400" aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-heading text-xl font-bold text-fg">Something went wrong.</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
        {error.message || "An unexpected error occurred while loading your dashboard."}
      </p>
      <Button size="lg" className="mt-6" onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
