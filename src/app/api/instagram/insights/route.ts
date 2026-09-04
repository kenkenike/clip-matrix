import { NextRequest, NextResponse } from "next/server";
import { parseInstagramUrl } from "@/lib/instagram/url-parser";
import { startScrape } from "@/lib/instagram/scraper";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = body?.url;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing required field: url" }, { status: 400 });
    }

    const parsed = parseInstagramUrl(url);
    if (!parsed.valid) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const jobId = await startScrape(url);

    return NextResponse.json({ jobId }, { status: 202 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
