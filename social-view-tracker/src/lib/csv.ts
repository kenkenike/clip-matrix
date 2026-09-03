import Papa from "papaparse";

export type CsvParseResult = {
  urls: string[];
  skippedRows: number;
};

/**
 * Parses uploaded CSV content and extracts candidate URLs. Accepts files with a
 * header such as `url`, `"Video URL"`, `link`, or a single column with no
 * header — anything that looks like a URL is collected on a best-effort basis.
 */
export function parseCsvUrls(text: string): CsvParseResult {
  const records = Papa.parse<Array<string>>(text.trim(), {
    skipEmptyLines: "greedy",
    delimitersToGuess: [",", ";", "\t"],
  }).data;

  const urls = new Set<string>();
  let skippedRows = 0;

  for (const record of records) {
    if (!Array.isArray(record) || record.length === 0) {
      skippedRows += 1;
      continue;
    }
    const isHeaderRow =
      record.length === 1 &&
      /^(url|video\s?url|link|post\s?url|youtube|instagram)$/i.test(record[0].trim());

    if (arrayStartsWithHeader(record) || isHeaderRow) continue;

    const cells = record.map((c) => (c ?? "").trim()).filter(Boolean);
    if (cells.length === 0) {
      skippedRows += 1;
      continue;
    }
    const candidate =
      cells.find((c) => looksLikeUrl(c)) ?? cells.find((c) => c.startsWith("http")) ?? cells[0];
    if (looksLikeUrl(candidate)) {
      urls.add(candidate);
    } else {
      skippedRows += 1;
    }
  }

  return { urls: Array.from(urls), skippedRows };
}

function arrayStartsWithHeader(record: Array<string>): boolean {
  return /[a-z]/i.test(record[0] ?? "") && !String(record[0]).includes("http") && !String(record[0]).includes("www") && /url|link/i.test(String(record[0]));
}

export function looksLikeUrl(value: string): boolean {
  return /^https?:\/\/[\w.-]+(\.[\w.-]+)+[/#?]?.*$/i.test(value) || /^www\.[\w.-]+\.[a-z]{2,}/i.test(value);
}