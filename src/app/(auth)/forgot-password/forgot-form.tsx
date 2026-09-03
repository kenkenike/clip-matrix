"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/inputs";
import { CheckCircle2 } from "lucide-react";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (sent) {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent-dim p-5 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-accent" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-fg">Check your inbox.</p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          If an account exists for {email}, reset instructions are on the way.
        </p>
        <Button variant="secondary" className="mt-5 w-full" onClick={() => setSent(false)}>
          Use a different email
        </Button>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(undefined);
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSent(true);
    }, 700);
  };

  return (
    <form onSubmit={submit} noValidate>
      <Label htmlFor="forgot-email">Email</Label>
      <Input
        id="forgot-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      <FieldError message={error} />
      <Button type="submit" size="lg" className="mt-5 w-full" loading={busy}>
        Send Reset Link
      </Button>
    </form>
  );
}
