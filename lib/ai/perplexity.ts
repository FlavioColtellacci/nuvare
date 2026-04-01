import type { PerplexityChatResponse } from "./types";

const PERPLEXITY_CHAT_URL = "https://api.perplexity.ai/chat/completions";

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

export async function fetchPerplexityRegulatoryContext(
  question: string,
  countries: string[],
  apiKey: string,
  deepResearch: boolean,
) {
  const year = new Date().getFullYear();
  const countryScope = countries.length > 0 ? countries.join(", ") : "relevant jurisdictions";
  const searchQuery = `Current ${question} rules and regulations for ${countryScope} ${year}`;

  const payload = await perplexityChatCompletion(apiKey, {
    model: deepResearch ? "sonar-deep-research" : "sonar",
    messages: [
      {
        role: "system",
        content:
          "You are a regulatory research assistant. Return concise, current regulatory facts with jurisdictions and dates where possible.",
      },
      {
        role: "user",
        content: searchQuery,
      },
    ],
  });

  const context = getPerplexityMessageContent(payload);
  return { context, searchQuery };
}
