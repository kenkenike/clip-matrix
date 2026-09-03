"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/client-fetch";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toaster";

export function ContentDetailActions({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    try {
      await apiFetch(`/api/content/${id}/refresh`, { method: "POST" });
      toast({ kind: "success", title: "Check queued" });
      setTimeout(() => router.refresh(), 1200);
    } catch (err) {
      toast({ kind: "error", title: "Refresh failed", description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Remove this item and its snapshot history?")) return;
    setBusy(true);
    try {
      await apiFetch(`/api/content/${id}`, { method: "DELETE" });
      toast({ kind: "success", title: "Removed" });
      router.replace("/app/content");
      router.refresh();
    } catch (err) {
      toast({ kind: "error", title: "Could not remove", description: (err as Error).message });
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={refresh} disabled={busy}>
        <RefreshCw className={cn(busy ? "animate-spin" : "")} /> Re-check now
      </Button>
      <Button variant="ghost" size="sm" onClick={remove} disabled={busy} className="text-muted-foreground hover:text-destructive">
        <Trash2 /> Remove
      </Button>
    </div>
  );
}