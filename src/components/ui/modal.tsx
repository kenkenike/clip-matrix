"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useMounted } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const mounted = useMounted();
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-end justify-center sm:items-center">
      <button
        aria-label="Close dialog"
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          "animate-fade-up relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-surface shadow-2xl sm:max-w-lg sm:rounded-none",
          className
        )}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/95 px-5 py-4 backdrop-blur">
            <div>
              <h2 id={titleId} className="font-heading text-lg font-semibold">
                {title}
              </h2>
              {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {!title && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {children}
        {footer && (
          <div className="sticky bottom-0 border-t border-line bg-surface/95 px-5 py-4 backdrop-blur">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Confirm",
  destructive = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
  destructive?: boolean;
}) {
  const [working, setWorking] = useState(false);

  return (
    <Modal open={open} onClose={onClose} className="sm:max-w-md">
      <div className="p-6">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "primary"}
            loading={working}
            onClick={() => {
              setWorking(true);
              setTimeout(() => {
                setWorking(false);
                onConfirm();
                onClose();
              }, 600);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
