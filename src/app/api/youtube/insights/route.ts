import { NextRequest, NextResponse } from "next/server";
import { parseYouTubeUrl } from "@/lib/youtube/parser";
import { createJob, completeJob, failJob, updateJob } from "@/lib/youtube/jobs";
import { fetchVideoInsights } from "@/lib/youtube/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = body?.url;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing required field: url" }, { status: 400 });
    }

    const parsed = parseYouTubeUrl(url);
    if (!parsed.valid) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const job = createJob(url);

    // For videos/shorts, fetch immediately (YouTube API is fast)
    if (parsed.videoId) {
      updateJob(job.id, { status: "running", attempts: 1 });
      const result = await fetchVideoInsights(parsed.videoId);
      if ("error" in result) {
        failJob(job.id, result.error);
      } else {
        completeJob(job.id, result);
      }
    } else {
      failJob(job.id, "Channel URLs not supported yet — paste a video or shorts URL");
    }

    return NextResponse.json({ jobId: job.id }, { status: 202 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
