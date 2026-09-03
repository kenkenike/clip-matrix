import { NextRequest } from "next/server";
import { apiError, getApiUser, json } from "@/lib/api";
import { parseCsvUrls } from "@/lib/csv";
import { trackUrls } from "@/lib/services/content";

export async function POST(request: NextRequest) {
  const { user, error } = await getApiUser();
  if (error) return error;

  const text = await request.text();
  if (!text || text.trim().length === 0) {
    return apiError("Empty CSV file. Upload a file containing YouTube or Instagram URLs.", 422, "EMPTY_CSV");
  }
  if (text.length > 2 * 1024 * 1024) {
    return apiError("CSV file too large (max 2MB).", 413, "TOO_LARGE");
  }

  const parsed = parseCsvUrls(text);
  if (parsed.urls.length === 0) {
    return apiError(
      "No valid URLs found in the CSV. Expected one YouTube or Instagram URL per row.",
      422,
      "NO_URLS",
    );
  }

  const { created, failed } = await trackUrls(user.id, parsed.urls);
  return json(
    {
      scanned: parsed.urls.length,
      skippedRows: parsed.skippedRows,
      created,
      failed: failed.map((f) => f.error),
      summary: `${created} tracked, ${failed.length} invalid, ${parsed.skippedRows} rows skipped`,
    },
    { status: created > 0 ? 201 : 200 },
  );
}