"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Search,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/ui/avatar";
import { SearchBar } from "@/components/ui/inputs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function DashboardShell({
  nav,
  userName,
  userHandle,
  workspaceLabel,
  accentBadge,
  bottomNav,
  dark = false,
  onSignOut,
  children,
}: {
  nav: NavItem[];
  userName: string;
  userHandle: string;
  workspaceLabel?: string;
  accentBadge?: string;
  bottomNav?: NavItem[];
  dark?: boolean;
  onSignOut?: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sectionRoots = new Set(["/dashboard", "/brand", "/admin"]);
  const isActive = (href: string) =>
    sectionRoots.has(href)
      ? pathname === href
      : pathname === href || pathname.startsWith(href);

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-3">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
            isActive(item.href)
              ? "bg-accent-dim text-accent shadow-[inset_0_0_0_1px_rgba(163,230,53,0.25)]"
              : "text-muted hover:bg-white/5 hover:text-fg"
          )}
        >
          <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const bottomItems = bottomNav ?? nav.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line lg:flex",
          dark ? "bg-background" : "bg-surface"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <Link href="/">
            <Logo />
          </Link>
          {accentBadge && <Badge tone="danger">{accentBadge}</Badge>}
        </div>
        {workspaceLabel && (
          <p className="px-5 pt-4 pb-1 text-xs font-semibold tracking-wider text-faint uppercase">
            {workspaceLabel}
          </p>
        )}
        <div className="flex-1 overflow-y-auto">{sidebar}</div>
        <div className="border-t border-line p-4">
          <div className="flex items-center gap-3">
            <Avatar name={userName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg">{userName}</p>
              <p className="truncate text-xs text-muted">{userHandle}</p>
            </div>
            {onSignOut && (
              <button
                onClick={onSignOut}
                aria-label="Sign out"
                title="Sign out"
                className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-fg"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 cursor-pointer bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={cn(
              "absolute inset-y-0 left-0 w-64 border-r border-line",
              dark ? "bg-background" : "bg-surface"
            )}
          >
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <Logo />
              <button
                aria-label="Close"
                className="cursor-pointer text-muted hover:text-fg"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-[calc(100%-8rem)] overflow-y-auto">{sidebar}</div>
            <div className="absolute inset-x-0 bottom-0 border-t border-line p-4">
              <p className="truncate text-sm font-semibold text-fg">{userName}</p>
              <p className="truncate text-xs text-muted">{userHandle}</p>
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            aria-label="Open menu"
            className="cursor-pointer rounded-lg p-2 text-muted hover:bg-white/5 hover:text-fg lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden w-full max-w-sm sm:block">
            <SearchBar value="" onChange={() => {}} placeholder={`Search ${workspaceLabel ?? "workspace"}...`} />
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              aria-label="Notifications"
              className="relative cursor-pointer rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-fg"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
            </button>
            <Avatar name={userName} size="sm" className="sm:hidden" />
            <span className="text-sm font-medium text-fg">{userName}</span>
          </div>
        </header>

        <main className="px-4 pt-6 pb-24 sm:px-6 lg:pb-10">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 grid border-t border-line bg-surface/95 backdrop-blur-xl lg:hidden"
        style={{ gridTemplateColumns: `repeat(${bottomItems.length}, minmax(0, 1fr))` }}
      >
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
              isActive(item.href) ? "text-accent" : "text-muted hover:text-fg"
            )}
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
