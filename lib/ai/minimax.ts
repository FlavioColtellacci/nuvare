/**
 * MiniMax OpenAI-compatible Chat Completions API (M2.7 tool use).
 * @see https://platform.minimax.io/docs/api-reference/text-openai-api.md
 */

const DEFAULT_BASE = "https://api.minimax.io/v1";
export const DEFAULT_MINIMAX_MODEL = "MiniMax-M2.7";

export type MinimaxToolCall = {
  id: string;
  type?: string;
  function: {
    name: string;
    arguments: string;
  };
  index?: number;
};

export type MinimaxChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  name?: string;
  tool_calls?: MinimaxToolCall[];
  tool_call_id?: string;
  reasoning_details?: unknown[];
};

export type MinimaxChatCompletionRequest = {
  model: string;
  messages: MinimaxChatMessage[];
  tools?: unknown[];
  tool_choice?: "auto" | "none" | unknown;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  /** MiniMax: split thinking into reasoning_details for cleaner content + history pass-back */
  reasoning_split?: boolean;
};

export type MinimaxChatCompletionChoice = {
  finish_reason?: string | null;
  message?: {
    role?: string;
    content?: string | null;
    tool_calls?: MinimaxToolCall[];
    reasoning_details?: unknown[];
    name?: string;
    audio_content?: string;
  };
};

export type MinimaxChatCompletionResponse = {
  id?: string;
  choices?: MinimaxChatCompletionChoice[];
  usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
  base_resp?: { status_code?: number; status_msg?: string };
};

export function getMinimaxConfig() {
  const apiKey = process.env.MINIMAX_API_KEY?.trim();
  const baseUrl = (process.env.MINIMAX_API_BASE?.trim() || DEFAULT_BASE).replace(/\/$/, "");
  const model = process.env.MINIMAX_MODEL?.trim() || DEFAULT_MINIMAX_MODEL;
  return { apiKey, baseUrl, model };
}

export function assertMinimaxConfigured(): { apiKey: string; baseUrl: string; model: string } {
  const cfg = getMinimaxConfig();
  if (!cfg.apiKey) {
    throw new Error("Missing MINIMAX_API_KEY.");
  }
  return cfg as { apiKey: string; baseUrl: string; model: string };
}

/**
 * Non-streaming chat completion for agent tool loops.
 */
export async function minimaxChatCompletion(
  body: MinimaxChatCompletionRequest,
): Promise<MinimaxChatCompletionResponse> {
  const { apiKey, baseUrl } = assertMinimaxConfigured();
  const url = `${baseUrl}/chat/completions`;
  const payload: MinimaxChatCompletionRequest = {
    ...body,
    stream: false,
    reasoning_split: body.reasoning_split ?? true,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = (await response.json().catch(() => null)) as MinimaxChatCompletionResponse | null;

  if (!response.ok) {
    const msg =
      raw?.base_resp?.status_msg ||
      (typeof raw === "object" && raw !== null && "error" in raw
        ? String((raw as { error?: { message?: string } }).error?.message)
        : null) ||
      `MiniMax HTTP ${response.status}`;
    throw new Error(msg);
  }

  const code = raw?.base_resp?.status_code;
  if (code !== undefined && code !== 0) {
    throw new Error(raw?.base_resp?.status_msg || `MiniMax status_code ${code}`);
  }

  return raw ?? {};
}

export function getAssistantMessage(
  data: MinimaxChatCompletionResponse,
): MinimaxChatCompletionChoice["message"] | undefined {
  return data.choices?.[0]?.message;
}
