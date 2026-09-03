"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Boxes,
  Bug,
  Clapperboard,
  FileText,
  History,
  LogOut,
  Plus,
  Settings,
  Webhook,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { title: string; items: NavItem[] };

const baseNavGroups: NavGroup[] = [
  {
    title: "Main",
    items: [
      { href: "/app", label: "Dashboard", icon: BarChart3 },
      { href: "/app/content", label: "Content", icon: Boxes },
      { href: "/app/reels", label: "Reels", icon: Clapperboard },
      { href: "/app/add", label: "Add content", icon: Plus },
    ],
  },
  {
    title: "Analytics",
    items: [
      { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/app/history", label: "History", icon: History },
      { href: "/app/export", label: "Export", icon: FileText },
    ],
  },
  {
    title: "Developer",
    items: [
      { href: "/app/api", label: "API & Webhooks", icon: Webhook },
      { href: "/app/alerts", label: "Alerts", icon: Bell },
    ],
  },
  {
    title: "Account",
    items: [{ href: "/app/settings", label: "Settings", icon: Settings }],
  },
];

function navGroups(isAdmin: boolean): NavGroup[] {
  if (!isAdmin) return baseNavGroups;
  return [
    ...baseNavGroups,
    {
      title: "Admin",
      items: [{ href: "/admin/instagram-debug", label: "Instagram debug", icon: Bug }],
    },
  ];
}

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const groups = navGroups(isAdmin);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Link href="/app" className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BarChart3 className="h-4 w-4" />
          </span>
          Social View Tracker
        </Link>
      </div>
      <nav className="flex-1 gap-6 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.title} className="mb-6">
            <p className="mb-1.5 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/app"
                    ? pathname === "/app"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                      active && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t px-3 py-3">
        <p className="px-1 text-xs text-muted-foreground">Your data is yours.</p>
      </div>
    </aside>
  );
}

export function Topbar({ title, userName, userEmail }: { title: string; userName: string; userEmail: string }) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold md:text-base">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {(userName ?? "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="hidden leading-tight lg:block">
            <p className="text-sm font-medium">{userName}</p>
            <p className="max-w-[160px] truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => {
            void fetch("/api/auth/logout", { method: "POST" }).finally(() => {
              router.push("/login");
              router.refresh();
            });
          }}
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="flex overflow-x-auto border-t bg-card px-2 py-1 md:hidden">
      {navGroups(isAdmin).flatMap((g) => g.items).map((item) => {
        const active =
          item.href === "/app" ? pathname === "/app" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent",
              active && "bg-primary/10 text-primary",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  userName,
  userEmail,
  isAdmin = false,
}: {
  children: ReactNode;
  userName: string;
  userEmail: string;
  isAdmin?: boolean;
}) {
  return (
    <div className="flex min-h-svh">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title="Dashboard" userName={userName} userEmail={userEmail} />
        <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
        <MobileNav isAdmin={isAdmin} />
      </div>
    </div>
  );
}