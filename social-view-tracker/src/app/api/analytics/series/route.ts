import { NextRequest } from "next/server";
import { getApiUser, json } from "@/lib/api";
import {
  getProjectionSeries,
  dailyGrowth,
  type TimeRange,
} from "@/lib/services/analytics";

const DAY = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { user, error } = await getApiUser();
  if (error) return error;

  const sp = request.nextUrl.searchParams;
  const granularity = sp.get("granularity") === "weekly" ? "weekly" : "daily";

  let to = new Date();
  let from: Date;
  const days = Number(sp.get("days") ?? 30);
  if (Number.isFinite(days) && days > 0 && days <= 365) {
    from = new Date(to.getTime() - days * DAY);
  } else {
    from = new Date(to.getTime() - 30 * DAY);
  }
  if (sp.get("from")) {
    const parsed = new Date(sp.get("from") as string);
    if (!Number.isNaN(parsed.getTime())) from = parsed;
  }
  if (sp.get("to")) {
    const parsed = new Date(sp.get("to") as string);
    if (!Number.isNaN(parsed.getTime())) to = parsed;
  }

  const range: TimeRange = { from, to, granularity };
  const series = await getProjectionSeries(user.id, range);
  const growth = dailyGrowth(series);

  return json(
    { range: { from, to }, granularity, series, growth },
    { headers: { "Cache-Control": "no-store" } },
  );
}