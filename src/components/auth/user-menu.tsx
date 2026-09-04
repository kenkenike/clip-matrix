"use client";

import Link from "next/link";
import { useAuth } from "./auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function UserMenu() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="h-8 w-20 animate-pulse rounded-lg bg-white/5" />
    );
  }

  if (!user) {
    return (
      <>
        <ButtonLink href="/login" variant="ghost" size="sm">
          Log in
        </ButtonLink>
        <ButtonLink href="/signup" size="sm">
          Start Creating
        </ButtonLink>
      </>
    );
  }

  const dashboardHref =
    user.role === "admin"
      ? "/admin"
      : user.role === "moderator"
        ? "/mod"
        : user.role === "brand"
          ? "/brand"
          : "/dashboard";

  return (
    <div className="flex items-center gap-2.5">
      <Link
        href={dashboardHref}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
      >
        <Avatar name={user.displayName} size="sm" src={user.avatar ?? undefined} />
        <span className="hidden text-sm font-medium text-fg lg:inline">
          {user.displayName}
        </span>
      </Link>
      <button
        onClick={signOut}
        className="cursor-pointer rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-fg"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
