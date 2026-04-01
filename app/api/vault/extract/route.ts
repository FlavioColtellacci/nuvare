import { NextResponse } from "next/server";

import { logApiError } from "@/lib/log";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const EXTRACTION_SYSTEM_PROMPT =
  "You are a document analysis assistant. Extract all important dates and deadlines from the provided document. Return a JSON array only, with no explanation or extra text. Each item must have exactly these fields: { label: string, date: string (YYYY-MM-DD format), notes: string }. Examples of dates to extract: passport expiry date, visa expiry date, permit renewal date, tax filing deadline, insurance renewal date, certificate expiry. If no dates can be found, return an empty array [].";

type ExtractPayload = {
  documentId?: string;
};

type ClaudeResponse = {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
};

type ExtractedDate = {
  label: string;
  date: string;
  notes: string;
};

function normalizeMediaType(fileType: string | null) {
  if (fileType === "application/pdf") {
    return { mediaType: "application/pdf", isPdf: true };
  }
  if (fileType === "image/png") {
    return { mediaType: "image/png", isPdf: false };
  }
  return { mediaType: "image/jpeg", isPdf: false };
}

function isExtractedDate(value: unknown): value is ExtractedDate {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.label === "string" &&
    typeof candidate.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(candidate.date) &&
    typeof candidate.notes === "string"
  );
}

async function markDocumentAsError(documentId: string) {
  const adminSupabase = createAdminClient();
  await adminSupabase
    .from("documents")
    .update({
      processing_status: "error",
    })
    .eq("id", documentId);
}

function cleanClaudeJsonOutput(rawText: string) {
  const trimmed = rawText.trim();
  if (!trimmed.startsWith("```")) return trimmed;

  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

export async function POST(request: Request) {
  let documentId: string | null = null;

  try {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY." }, { status: 500 });
    }

    const payload = (await request.json()) as ExtractPayload;
    documentId = payload.documentId?.trim() ?? null;
    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId." }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const { data: document, error: documentError } = await adminSupabase
      .from("documents")
      .select("id, file_path, file_type")
      .eq("id", documentId)
      .maybeSingle();

    if (documentError || !document) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const { data: fileData, error: downloadError } = await adminSupabase.storage
      .from("vault")
      .download(document.file_path as string);

    if (downloadError || !fileData) {
      await markDocumentAsError(documentId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const fileBytes = Buffer.from(await fileData.arrayBuffer());
    const base64Document = fileBytes.toString("base64");
    const { mediaType, isPdf } = normalizeMediaType(
      typeof document.file_type === "string" ? document.file_type : null,
    );

    const attachmentBlock = isPdf
      ? {
          type: "document",
          source: {
            type: "base64",
            media_type: mediaType,
            data: base64Document,
          },
        }
      : {
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType,
            data: base64Document,
          },
        };

    let claudePayload: ClaudeResponse | null = null;
    try {
      const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "pdfs-2024-09-25",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          system: EXTRACTION_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: [
                attachmentBlock,
                {
                  type: "text",
                  text: "Extract all important dates and deadlines from this document.",
                },
              ],
            },
          ],
        }),
      });

      if (claudeResponse.ok) {
        claudePayload = (await claudeResponse.json()) as ClaudeResponse;
      }
    } catch (claudeErr) {
      logApiError("/api/vault/extract", claudeErr, { phase: "claude_request" });
      await markDocumentAsError(documentId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const textOutput = (claudePayload?.content ?? [])
      .filter((block) => block.type === "text" && typeof block.text === "string")
      .map((block) => block.text ?? "")
      .join("");
    const cleanedJson = cleanClaudeJsonOutput(textOutput);

    let extractedDates: ExtractedDate[] = [];
    try {
      const parsedJson = JSON.parse(cleanedJson) as unknown;
      extractedDates = Array.isArray(parsedJson) ? parsedJson.filter(isExtractedDate) : [];
    } catch {
      extractedDates = [];
    }

    await adminSupabase
      .from("documents")
      .update({
        extracted_dates: extractedDates,
        processing_status: "complete",
      })
      .eq("id", documentId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logApiError("/api/vault/extract", error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
