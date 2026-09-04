"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/inputs";
import { useToast } from "@/components/ui/toast";
import { authService } from "@/lib/services";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const errorMessages: Record<string, string> = {
  invalid_request: "Invalid request. Please try again.",
  auth_failed: "Discord authentication failed. Please try again.",
  access_denied: "You denied Discord access. Please try again.",
};

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error && errorMessages[error]) {
      toast(errorMessages[error], "error");
    }
  }, [searchParams, toast]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setBusy(true);
    try {
      const user = await authService.signIn(email, password);
      toast(`Welcome back, ${user.name}.`, "success");
      router.push(
        user.role === "admin"
          ? "/admin"
          : user.role === "moderator"
            ? "/mod"
            : user.role === "brand"
              ? "/brand"
              : "/dashboard"
      );
    } catch (error) {
      setErrors({
        password:
          error instanceof Error ? error.message : "Could not sign you in. Try again.",
      });
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="space-y-4">
        <div>
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <FieldError message={errors.email} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <a href="/forgot-password" className="text-xs font-medium text-accent hover:underline">
              Forgot password?
            </a>
          </div>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
          <FieldError message={errors.password} />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Log In
        </Button>
      </div>
    </form>
  );
}
