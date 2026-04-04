import type { ExtractedDate, VaultDocument } from "./types";

export function isExtractedDate(value: unknown): value is ExtractedDate {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.label === "string" &&
    typeof candidate.date === "string" &&
    typeof candidate.notes === "string"
  );
}

export function normalizeExtractedDates(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter(isExtractedDate);
}

export function normalizeDocumentRow(
  value: Record<string, unknown>,
): VaultDocument | null {
  const id = typeof value.id === "string" ? value.id : null;
  const fileName = typeof value.file_name === "string" ? value.file_name : null;
  const createdAt = typeof value.created_at === "string" ? value.created_at : null;
  const status =
    value.processing_status === "pending" ||
    value.processing_status === "complete" ||
    value.processing_status === "error"
      ? value.processing_status
      : null;

  if (!id || !fileName || !createdAt || !status) return null;

  return {
    id,
    file_name: fileName,
    file_type: typeof value.file_type === "string" ? value.file_type : null,
    created_at: createdAt,
    processing_status: status,
    extracted_dates: normalizeExtractedDates(value.extracted_dates),
  };
}

export function formatUploadDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function isPdf(fileType: string | null) {
  return fileType === "application/pdf";
}

export function isImage(fileType: string | null) {
  return fileType === "image/jpeg" || fileType === "image/png";
}
