import type { PerplexityChatResponse } from "./types";

const PERPLEXITY_CHAT_URL = "https://api.perplexity.ai/chat/completions";

/** Max length sent to Perplexity after minimization (prefetch + tool). */
export const PERPLEXITY_REGULATORY_QUERY_MAX_LEN = 400;

const PERPLEXITY_REGULATORY_SYSTEM = [
  "You are a regulatory research assistant for compliance professionals.",
  "Return concise, current regulatory facts with jurisdictions and effective dates where possible.",
  "Do not ask for or assume personal identifiers (names, emails, phone numbers, tax IDs, account numbers, addresses).",
  "If the topic is unclear, answer at a general policy level without requesting private user data.",
].join(" ");

type PerplexityRequestMessage = { role: string; content: string };

function parsePerplexityHttpError(payload: unknown): string | undefined {
  const errorPayload = payload as { error?: { message?: string } | string } | null;
  if (!errorPayload?.error) return undefined;
  return typeof errorPayload.error === "string"
    ? errorPayload.error
    : errorPayload.error.message;
}

export type PerplexityChatCompletionOptions = {
  /** When set, thrown as `Error.message` on non-OK HTTP response (instead of API detail). */
  httpErrorMessage?: string;
  /** When set, thrown as `Error.message` when message content is empty. */
  emptyContentMessage?: string;
};

export async function perplexityChatCompletion(
  apiKey: string,
  body: { model: string; messages: PerplexityRequestMessage[] },
  options?: PerplexityChatCompletionOptions,
): Promise<PerplexityChatResponse> {
  const response = await fetch(PERPLEXITY_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as unknown;
    const errorMessage = parsePerplexityHttpError(errorPayload);
    throw new Error(
      options?.httpErrorMessage ??
        errorMessage ??
        "Unable to fetch live regulatory context.",
    );
  }

  return (await response.json()) as PerplexityChatResponse;
}

export function getPerplexityMessageContent(
  payload: PerplexityChatResponse,
  emptyMessage = "Perplexity returned empty regulatory context.",
): string {
  const content = payload.choices?.[0]?.message?.content?.trim() ?? "";
  if (!content) {
    throw new Error(emptyMessage);
  }
  return content;
}

/**
 * Strips common PII patterns and truncates before sending text to Perplexity.
 * Intended for user-derived strings (latest message, tool `query`).
 */
export function minimizeQueryForExternalResearch(
  raw: string,
  maxLen = PERPLEXITY_REGULATORY_QUERY_MAX_LEN,
): string {
  let s = raw.trim().replace(/\s+/g, " ");
  if (!s) return "";
  s = s.replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/gi, "[redacted]");
  s = s.replace(/https?:\/\/\S+/gi, "[url]");
  s = s.replace(/\b\d[\d\s().-]{8,}\d\b/g, "[redacted]");
  s = s.replace(/\b\d{9,}\b/g, "[redacted]");
  s = s.replace(/\s+/g, " ").trim();
  if (s.length > maxLen) {
    s = `${s.slice(0, maxLen).replace(/\s+\S*$/, "")}…`;
  }
  return s.trim();
}

export type PerplexityRegulatoryModel = "sonar" | "sonar-deep-research";

/**
 * Single Perplexity call for regulatory research (prefetch or tool path).
 */
export async function runPerplexityRegulatorySearch(params: {
  topicLine: string;
  countries: string[];
  apiKey: string;
  model: PerplexityRegulatoryModel;
}): Promise<string> {
  const year = new Date().getFullYear();
  const countryScope =
    params.countries.length > 0 ? params.countries.join(", ") : "relevant jurisdictions";
  const userContent = [
    `Regulatory topic (sanitized): ${params.topicLine}`,
    `Jurisdictions of interest: ${countryScope}`,
    `Reference year: ${year}.`,
    "Summarize current rules and cite official or reputable sources where possible.",
  ].join("\n");

  const payload = await perplexityChatCompletion(params.apiKey, {
    model: params.model,
    messages: [
      { role: "system", content: PERPLEXITY_REGULATORY_SYSTEM },
      { role: "user", content: userContent },
    ],
  });

  return getPerplexityMessageContent(payload);
}

/**
 * Optional deep-research prefetch: call only when the client requests `deepResearch`.
 * Uses a minimized slice of the latest user message (never full thread).
 */
export async function fetchPerplexityRegulatoryContext(
  latestUserMessage: string,
  countries: string[],
  apiKey: string,
  deepResearch: boolean,
) {
  const topic =
    minimizeQueryForExternalResearch(latestUserMessage) ||
    "General cross-border tax and residency compliance";
  const context = await runPerplexityRegulatorySearch({
    topicLine: topic,
    countries,
    apiKey,
    model: deepResearch ? "sonar-deep-research" : "sonar",
  });
  return { context, searchQuery: topic };
}
