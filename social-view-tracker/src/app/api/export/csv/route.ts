import { NextRequest } from "next/server";
import { getApiUserFromRequest, json } from "@/lib/api";
import { buildExportRows, rowsToCsv } from "@/lib/services/export";

export async function GET(request: NextRequest) {
  const { user, error } = await getApiUserFromRequest(request);
  if (error) return error;

  const sp = request.nextUrl.searchParams;
  const rows = await buildExportRows(user.id, {
    platform: (sp.get("platform")?.toUpperCase() as "YOUTUBE" | "INSTAGRAM" | "TIKTOK" | "X" | undefined) ?? undefined,
    status: (sp.get("status")?.toUpperCase() as "COMPLETED" | "FAILED" | "UNAVAILABLE" | "RATE_LIMITED" | "PROCESSING" | undefined) ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
  });
  const csv = rowsToCsv(rows);

  return json(
    {
      rows,
      summary: { count: rows.length },
      csvText: csv,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}