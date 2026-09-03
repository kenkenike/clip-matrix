import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCompact, formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlatformBadge } from "@/components/platform-badge";

export const metadata = { title: "History" };

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user?.id) return null;

  const snapshots = await prisma.metricSnapshot.findMany({
    where: { userId: user.id },
    orderBy: { capturedAt: "desc" },
    take: 200,
    select: {
      id: true,
      capturedAt: true,
      views: true,
      likes: true,
      comments: true,
      platform: true,
      url: true,
      content: { select: { id: true, title: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="History"
        description="Recent metric snapshots across all tracked content."
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Captured at</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Likes</TableHead>
                <TableHead className="text-right">Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    No snapshots collected yet. Track content and run checks to build history.
                  </TableCell>
                </TableRow>
              ) : (
                snapshots.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono-nums text-sm">{formatDateTime(s.capturedAt)}</TableCell>
                    <TableCell>
                      <Link href={`/app/content/${s.content.id}`} className="block max-w-[280px] truncate text-sm font-medium hover:text-primary">
                        {s.content.title ?? "Untitled"}
                      </Link>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block max-w-[280px] truncate text-xs text-muted-foreground hover:text-foreground"
                      >
                        {s.url}
                      </a>
                    </TableCell>
                    <TableCell><PlatformBadge platform={s.platform} /></TableCell>
                    <TableCell className="text-right font-mono-nums text-sm">{s.views === null ? "—" : formatCompact(s.views)}</TableCell>
                    <TableCell className="text-right font-mono-nums text-sm">{s.likes === null ? "—" : formatCompact(s.likes)}</TableCell>
                    <TableCell className="text-right font-mono-nums text-sm">{s.comments === null ? "—" : formatCompact(s.comments)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}