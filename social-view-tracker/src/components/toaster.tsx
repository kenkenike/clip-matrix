"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
};

type ToastContextValue = {
  toast: (t: { kind: ToastKind; title: string; description?: string }) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <Toaster>");
  return ctx;
}

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: { kind: ToastKind; title: string; description?: string }) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, ...t }]);
      window.setTimeout(() => dismiss(id), 5500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto rounded-lg border bg-card px-4 py-3 shadow-lg"
            role="status"
          >
            <div className="flex items-start gap-2">
              {t.kind === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              ) : t.kind === "error" ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-card-foreground">{t.title}</p>
                {t.description ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">{t.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Dismiss"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}