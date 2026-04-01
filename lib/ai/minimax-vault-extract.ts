/**
 * Vault document date extraction via MiniMax native Text API (chatcompletion_v2).
 * Images: multimodal image_url + base64. PDFs: text extracted locally then sent as text (API has no PDF document input).
 * @see https://platform.minimax.io/docs/api-reference/text-post.md
 */

import { assertMinimaxConfigured } from "@/lib/ai/minimax";

export function minimaxV2ChatUrl(baseUrl: string): string {
  const b = baseUrl.replace(/\/$/, "");
  if (b.endsWith("/v1")) {
    return `${b}/text/chatcompletion_v2`;
  }
  return `${b}/v1/text/chatcompletion_v2`;
}

type V2UserContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type V2ChatResponse = {
  choices?: Array<{
    finish_reason?: string;
    message?: {
      role?: string;
      content?: string;
      name?: string;
      audio_content?: string;
    };
  }>;
  base_resp?: { status_code?: number; status_msg?: string };
};

const MAX_PDF_TEXT_CHARS = 120_000;

/**
 * Extract embedded text from a PDF buffer (scanned/image-only PDFs may return little or no text).
 */
export async function extractPdfTextForVault(buffer: Buffer): Promise<string> {
  const mod = await import("pdf-parse");
  const pdfParse = mod.default as (b: Buffer) => Promise<{ text?: string }>;
  const result = await pdfParse(buffer);
  const text = (result.text ?? "").replace(/\s+/g, " ").trim();
  return text.length > MAX_PDF_TEXT_CHARS
    ? `${text.slice(0, MAX_PDF_TEXT_CHARS)}…`
    : text;
}

/**
 * Ask MiniMax to return only a JSON array of extracted dates (see vault extract system prompt).
 */
export async function minimaxVaultExtractJson(params: {
  systemPrompt: string;
  userInstruction: string;
  mode: "image" | "text";
  /** For mode image */
  mediaType?: string;
  base64Data?: string;
  /** For mode text */
  documentText?: string;
}): Promise<string> {
  const { apiKey, baseUrl, model } = assertMinimaxConfigured();
  const url = minimaxV2ChatUrl(baseUrl);

  let userContent: string | V2UserContentPart[];
  if (params.mode === "image" && params.base64Data && params.mediaType) {
    const dataUrl = `data:${params.mediaType};base64,${params.base64Data}`;
    userContent = [
      { type: "text", text: params.userInstruction },
      { type: "image_url", image_url: { url: dataUrl } },
    ];
  } else if (params.mode === "text" && params.documentText) {
    userContent = [
      {
        type: "text",
        text: `${params.userInstruction}\n\n---\nDocument text:\n${params.documentText}`,
      },
    ];
  } else {
    throw new Error("Invalid vault extract payload for MiniMax.");
  }

  const body = {
    model,
    messages: [
      { role: "system", name: "MiniMax AI", content: params.systemPrompt },
      { role: "user", name: "User", content: userContent },
    ],
    stream: false,
    max_completion_tokens: 2048,
    temperature: 0.5,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = (await response.json().catch(() => null)) as V2ChatResponse | null;

  if (!response.ok) {
    const msg =
      raw?.base_resp?.status_msg ||
      `MiniMax vault extract HTTP ${response.status}`;
    throw new Error(msg);
  }

  const code = raw?.base_resp?.status_code;
  if (code !== undefined && code !== 0) {
    throw new Error(raw?.base_resp?.status_msg || `MiniMax status_code ${code}`);
  }

  const text = raw?.choices?.[0]?.message?.content ?? "";
  if (typeof text !== "string") {
    throw new Error("MiniMax returned no text content.");
  }
  return text;
}
