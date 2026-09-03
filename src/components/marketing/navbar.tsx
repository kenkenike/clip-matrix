"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/creators", label: "For Creators" },
  { href: "/brands", label: "For Brands" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/resources", label: "Resources" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/75 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Clip Matrix home" onClick={close}>
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link relative px-2.5 py-2 font-mono text-[13px] font-light tracking-wide text-muted transition-colors hover:text-fg"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2.5 lg:flex">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/brands" variant="secondary" size="sm">
            Launch Campaign
          </ButtonLink>
          <ButtonLink href="/signup" size="sm">
            Start Creating
          </ButtonLink>
        </div>

        <button
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-fg lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <div
        className={cn(
          "grid overflow-hidden border-line transition-all duration-300 ease-out lg:hidden",
          open ? "grid-rows-[1fr] border-t opacity-100" : "grid-rows-[0fr] border-t-0 opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-muted transition-colors hover:bg-white/5 hover:text-fg"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2.5 pt-3">
              <ButtonLink href="/login" variant="secondary" className="w-full">
                Log in
              </ButtonLink>
              <ButtonLink href="/brands" variant="secondary" className="w-full">
                Launch Campaign
              </ButtonLink>
              <ButtonLink href="/signup" className="w-full">
                Start Creating
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
