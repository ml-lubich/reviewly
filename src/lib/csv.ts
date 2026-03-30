import type { Review } from "./types";

const CSV_HEADERS = [
  "reviewer_name",
  "rating",
  "review_text",
  "review_date",
  "status",
  "reply_text",
  "reply_status",
  "reply_published_at",
] as const;

function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function reviewsToCsv(reviews: Review[]): string {
  const header = CSV_HEADERS.join(",");
  const rows = reviews.map((r) =>
    [
      escapeCsvField(r.reviewer_name),
      escapeCsvField(r.rating),
      escapeCsvField(r.review_text),
      escapeCsvField(r.review_date),
      escapeCsvField(r.status),
      escapeCsvField(r.reply?.final_text ?? r.reply?.generated_text),
      escapeCsvField(r.reply?.status),
      escapeCsvField(r.reply?.published_at),
    ].join(",")
  );
  return [header, ...rows].join("\n");
}
