"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/inputs";
import { useToast } from "@/components/ui/toast";
import { DiscordIcon } from "@/components/icons";

const socialButton =
  "flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-line bg-surface-alt px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-white/5";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-none border border-line bg-surface p-7 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] sm:p-8">
      <h1 className="font-heading text-2xl font-bold tracking-tight text-fg">{title}</h1>
      <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
      <div className="mt-7">{children}</div>
      {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
    </div>
  );
}

export function SocialButtons() {
  const [loading, setLoading] = useState(false);

  const handleDiscord = () => {
    setLoading(true);
    window.location.href = "/api/auth/discord/login";
  };

  return (
    <button
      type="button"
      onClick={handleDiscord}
      disabled={loading}
      className={socialButton}
    >
      <DiscordIcon className="h-4 w-4" /> {loading ? "Redirecting to Discord..." : "Continue with Discord"}
    </button>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-white/10" />
      <span className="text-xs tracking-wide text-faint uppercase">{label}</span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

export function useAuthForm(initialEmail = "") {
  const { toast } = useToast();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

  const validate = (needPassword: boolean) => {
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
    if (needPassword) {
      if (password.length < 8) next.password = "Password must be at least 8 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitWith = (needPassword: boolean, run: () => void) => (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(needPassword)) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      run();
    }, 700);
  };

  return { toast, email, setEmail, password, setPassword, errors, busy, submitWith };
}

export { Button, ButtonLink, Input, Label, FieldError };
