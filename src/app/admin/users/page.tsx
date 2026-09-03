import type { Metadata } from "next";
import { AdminUsersView } from "@/app/admin/users-view";

export const metadata: Metadata = {
  title: "Users",
  description: "Search and manage every account on the Clip Matrix platform.",
};

export default function AdminUsersPage() {
  return <AdminUsersView />;
}
