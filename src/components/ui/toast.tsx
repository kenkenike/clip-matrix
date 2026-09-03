"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";

interface ToastEntry {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastApi>({ toast: () => {} });

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

const kindStyles: Record<ToastKind, string> = {
  success: "border-accent/40 text-fg",
  error: "border-red-500/40 text-fg",
  info: "border-line-strong text-fg",
};

const kindIcons: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />,
  error: <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0 text-red-400" />,
  info: <Info aria-hidden="true" className="h-4 w-4 shrink-0 text-sky-400" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = "success") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-3), { id, kind, message }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-20 z-[200] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:bottom-6"
      >
        {toasts.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              "animate-fade-up pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-elevated/95 px-4 py-3 shadow-xl backdrop-blur",
              kindStyles[entry.kind]
            )}
          >
            {kindIcons[entry.kind]}
            <p className="flex-1 text-sm leading-snug">{entry.message}</p>
            <button
              onClick={() => dismiss(entry.id)}
              aria-label="Dismiss notification"
              className="cursor-pointer text-muted transition-colors hover:text-fg"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
