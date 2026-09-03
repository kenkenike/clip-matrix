"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Ellipsis, Eye, UserMinus, ShieldOff, Megaphone } from "lucide-react";
import type { AdminUserRow } from "@/lib/services/types";
import { adminService } from "@/lib/services";
import { useAsync } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal, ConfirmationDialog } from "@/components/ui/modal";
import { SearchBar } from "@/components/ui/inputs";
import { Button } from "@/components/ui/button";
import { TableWrap, THead, Th, Tr, Td, TableEmpty } from "@/components/ui/table";
import { SkeletonTable, ErrorState } from "@/components/ui/skeleton";
import { RoleBadge } from "@/components/admin/role-badge";
import { useToast } from "@/components/ui/toast";
import { formatCurrencyCompact, formatDateShort } from "@/lib/format";

type ConfirmAction =
  | { kind: "ban"; user: AdminUserRow }
  | { kind: "kick"; user: AdminUserRow }
  | null;

export function AdminUsersView() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<AdminUserRow | null>(null);
  const [profileCampaigns, setProfileCampaigns] = useState<string[]>([] as string[]);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [working, setWorking] = useState(false);
  const { data, loading, error, retry } = useAsync<AdminUserRow[]>(() => adminService.listUsers(), []);
  const [campaignMap, setCampaignMap] = useState<Record<string, string[]>>({});

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openMenuId]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.handle.toLowerCase().includes(q)
    );
  }, [data, query]);

  useEffect(() => {
    if (!filtered.length) return;
    let cancelled = false;
    const fetchAll = async () => {
      const entries = await Promise.all(
        filtered.map(async (u) => {
          try {
            const campaigns = await adminService.getUserCampaigns(u.id);
            return [u.id, campaigns] as [string, string[]];
          } catch {
            return [u.id, [] as string[]] as [string, string[]];
          }
        })
      );
      if (!cancelled) {
        setCampaignMap((prev) => {
          const next = { ...prev };
          for (const [id, campaigns] of entries) next[id] = campaigns;
          return next;
        });
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [filtered]);

  const openProfile = async (user: AdminUserRow) => {
    setProfileUser(user);
    setProfileCampaigns([]);
    setOpenMenuId(null);
    try {
      const campaigns = await adminService.getUserCampaigns(user.id);
      setProfileCampaigns(campaigns);
    } catch {
      setProfileCampaigns([]);
    }
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    setWorking(true);
    try {
      if (confirmAction.kind === "ban") {
        await adminService.banUser(confirmAction.user.id);
        toast(`${confirmAction.user.name} has been banned.`, "success");
      } else {
        await adminService.kickUser(confirmAction.user.id);
        toast(`${confirmAction.user.name} has been removed.`, "success");
      }
      setConfirmAction(null);
      setProfileUser(null);
      retry();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Action failed.", "error");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-fg sm:text-3xl">Users</h1>
        <p className="mt-1.5 text-sm text-muted">
          Every creator, brand, moderator, and admin account on the platform.
        </p>
      </div>

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search by name, handle, or email..."
        ariaLabel="Search users"
        className="max-w-md"
      />

      <Card className="rounded-xl overflow-visible">
        {loading && <SkeletonTable rows={6} cols={7} />}
        {error && <ErrorState message={error} onRetry={retry} />}
        {!loading && !error && (
          <TableWrap className="border-0 rounded-none">
              <THead>
                <Th>User</Th>
                <Th>Role</Th>
                <Th>Campaigns</Th>
                <Th>Joined</Th>
                <Th>Lifetime value</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </THead>
              <tbody>
                {filtered.map((user) => {
                  const userCampaigns = campaignMap[user.id] ?? [];
                  return (
                    <Tr key={user.id}>
                      <Td>
                        <button
                          type="button"
                          onClick={() => openProfile(user)}
                          className="flex cursor-pointer items-center gap-3 text-left"
                        >
                          <Avatar name={user.name} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-fg hover:underline">
                              {user.name}
                            </span>
                            <span className="block truncate text-xs text-muted">{user.email}</span>
                          </span>
                        </button>
                      </Td>
                      <Td>
                        <RoleBadge role={user.role} />
                      </Td>
                      <Td>
                        {userCampaigns.length === 0 ? (
                          <span className="text-xs text-muted">—</span>
                        ) : (
                          <span className="flex max-w-[180px] flex-wrap gap-1">
                            {userCampaigns.slice(0, 2).map((name) => (
                              <span
                                key={name}
                                className="inline-flex items-center gap-1 rounded-md border border-line bg-white/5 px-2 py-0.5 text-[11px] font-medium text-muted"
                              >
                                <Megaphone className="h-2.5 w-2.5" aria-hidden="true" />
                                {name}
                              </span>
                            ))}
                            {userCampaigns.length > 2 && (
                              <span className="text-[11px] text-muted">
                                +{userCampaigns.length - 2}
                              </span>
                            )}
                          </span>
                        )}
                      </Td>
                      <Td className="text-muted">{formatDateShort(user.joinedAt)}</Td>
                      <Td className="tabular-nums">
                        {formatCurrencyCompact(user.lifetimeValueMinor)}
                      </Td>
                      <Td>
                        <StatusBadge status={user.status} />
                      </Td>
                      <Td className="relative text-right">
                        <div ref={openMenuId === user.id ? menuRef : undefined}>
                        <button
                          type="button"
                          aria-label={`Actions for ${user.name}`}
                          aria-expanded={openMenuId === user.id}
                          onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                          className="cursor-pointer rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-fg"
                        >
                          <Ellipsis className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {openMenuId === user.id && (
                          <div className="absolute right-4 top-12 z-20 w-48 overflow-hidden rounded-xl border border-line bg-elevated py-1 shadow-xl">
                            <button
                              type="button"
                              onClick={() => openProfile(user)}
                              className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-muted transition-colors hover:bg-white/5 hover:text-fg"
                            >
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" /> View profile
                            </button>
                            {user.status !== "banned" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setConfirmAction({ kind: "ban", user });
                                }}
                                className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-amber-400 transition-colors hover:bg-white/5"
                              >
                                <ShieldOff className="h-3.5 w-3.5" aria-hidden="true" /> Ban
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setConfirmAction({ kind: "kick", user });
                              }}
                              className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-red-400 transition-colors hover:bg-white/5"
                            >
                              <UserMinus className="h-3.5 w-3.5" aria-hidden="true" /> Remove from platform
                            </button>
                          </div>
                        )}
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
                {filtered.length === 0 && (
                  <TableEmpty colSpan={7}>No users match that search.</TableEmpty>
                )}
              </tbody>
          </TableWrap>
        )}
      </Card>

      <Modal
        open={profileUser !== null}
        onClose={() => setProfileUser(null)}
        className="sm:max-w-lg"
        title="User profile"
        footer={
          <Button variant="secondary" onClick={() => setProfileUser(null)}>
            Close
          </Button>
        }
      >
        {profileUser && (
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center">
              <Avatar name={profileUser.name} size="lg" />
              <p className="mt-3 font-heading text-lg font-semibold text-fg">{profileUser.name}</p>
              <p className="text-sm text-muted">{profileUser.handle}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                <RoleBadge role={profileUser.role} />
                <StatusBadge status={profileUser.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-center">
              <div>
                <p className="text-xs font-medium uppercase text-muted">Email</p>
                <p className="mt-0.5 text-fg">{profileUser.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted">Joined</p>
                <p className="mt-0.5 text-fg">{formatDateShort(profileUser.joinedAt)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted">Lifetime value</p>
                <p className="mt-0.5 text-fg">{formatCurrencyCompact(profileUser.lifetimeValueMinor)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted">User ID</p>
                <p className="mt-0.5 font-mono text-xs text-muted">{profileUser.id}</p>
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface-alt p-4 text-center">
              <p className="text-xs font-medium uppercase text-muted">Campaigns</p>
              {profileCampaigns.length === 0 ? (
                <p className="mt-2 text-sm text-muted">No campaigns yet.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {profileCampaigns.map((name) => (
                    <li key={name} className="flex items-center justify-center gap-2 text-sm text-fg">
                      <Megaphone className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmationDialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeAction}
        destructive
        title={confirmAction?.kind === "ban" ? "Ban this user?" : "Remove this user?"}
        body={
          confirmAction?.kind === "ban"
            ? `${confirmAction.user.name} will be immediately blocked from logging in. Their campaigns and submissions will remain frozen. You can reverse this later by reactivating their account.`
            : `${confirmAction?.user.name} will be permanently deleted from the platform. All associated submissions, earnings, and campaign data will be removed. This cannot be undone.`
        }
        confirmLabel={confirmAction?.kind === "ban" ? "Ban user" : "Remove user"}
      />
    </div>
  );
}
