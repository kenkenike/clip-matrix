"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/inputs";
import { useAuthForm } from "@/app/(auth)/auth-kit";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const roles = [
  {
    id: "creator",
    title: "I'm a Creator",
    body: "Earn on verified views by clipping brand content.",
  },
  {
    id: "brand",
    title: "I'm a Brand",
    body: "Launch campaigns and pay only for verified performance.",
  },
];

export function SignupForm() {
  const { toast, email, setEmail, password, setPassword, errors, busy, submitWith } = useAuthForm();
  const [role, setRole] = useState("creator");

  return (
    <form
      onSubmit={submitWith(true, () =>
        toast(`Demo build: ${role} account creation is simulated.`, "success")
      )}
      noValidate
    >
      <div className="grid grid-cols-2 gap-2.5">
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(r.id)}
            aria-pressed={role === r.id}
            className={cn(
              "cursor-pointer rounded-xl border p-3.5 text-left transition-all",
              role === r.id
                ? "border-accent/50 bg-accent-dim shadow-[0_0_24px_-8px_rgba(163,230,53,0.4)]"
                : "border-line bg-surface-alt hover:bg-white/5"
            )}
          >
            <span className="flex items-center justify-between">
              <span className={cn("text-sm font-semibold", role === r.id ? "text-accent" : "text-fg")}>
                {r.title}
              </span>
              {role === r.id && <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-muted">{r.body}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <FieldError message={errors.email} />
        </div>
        <div>
          <Label htmlFor="signup-password" hint="At least 8 characters">
            Password
          </Label>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
          />
          <FieldError message={errors.password} />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Create Account
        </Button>
      </div>
    </form>
  );
}
