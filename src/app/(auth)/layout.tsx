import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="bg-grid absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="radial-glow absolute inset-0" aria-hidden="true" />
      <Link
        href="/"
        className="relative mb-8 inline-flex items-center gap-2 transition-opacity hover:opacity-80"
      >
        <Logo />
      </Link>
      <main className="relative w-full max-w-md">{children}</main>
      <p className="relative mt-8 text-xs text-faint">
        By continuing you agree to our{" "}
        <Link href="/terms" className="text-muted underline-offset-4 hover:text-fg hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-muted underline-offset-4 hover:text-fg hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
