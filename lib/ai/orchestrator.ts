import { buildAskSystemPrompt } from "@/lib/ai/prompts";
import {
  getAssistantMessage,
  minimaxChatCompletion,
  type MinimaxChatMessage,
  type MinimaxToolCall,
} from "@/lib/ai/minimax";
import { ASK_TOOL_DEFINITIONS } from "@/lib/ai/tools/definitions";
import {
  executeAskTool,
  type ToolHandlerContext,
} from "@/lib/ai/tools/handlers";
import { logApiEvent } from "@/lib/log";

/** Tuned for Vercel Hobby: keep tool rounds bounded */
export const MAX_MINIMAX_TOOL_STEPS = 6;

const MAX_COMPLETION_TOKENS = 4096;

type NormalizedTurn = { role: "user" | "assistant"; content: string };

function appendAssistantTurn(
  messages: MinimaxChatMessage[],
  assistant: {
    content?: string | null;
    tool_calls?: MinimaxToolCall[];
    reasoning_details?: unknown[];
  },
) {
  const row: MinimaxChatMessage = {
    role: "assistant",
    content: assistant.content ?? null,
  };
  if (assistant.tool_calls && assistant.tool_calls.length > 0) {
    row.tool_calls = assistant.tool_calls;
  }
  if (assistant.reasoning_details && assistant.reasoning_details.length > 0) {
    row.reasoning_details = assistant.reasoning_details as MinimaxChatMessage["reasoning_details"];
  }
  messages.push(row);
}

function textResponseStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

export type RunMinimaxAskParams = {
  model: string;
  conversation: NormalizedTurn[];
  toolContext: ToolHandlerContext;
  preloadedRegulatoryContext: string | null;
  /** When true, system prompt tells the model a deep Perplexity prefetch was used. */
  deepResearchPrefetch?: boolean;
};

/**
 * Runs MiniMax tool loop (non-streaming rounds), then returns a plain-text UTF-8 stream for the client.
 */
export async function runMinimaxAskOrchestration(
  params: RunMinimaxAskParams,
): Promise<ReadableStream<Uint8Array>> {
  const {
    model,
    conversation,
    toolContext,
    preloadedRegulatoryContext,
    deepResearchPrefetch = false,
  } = params;
  const systemPrompt = buildAskSystemPrompt(toolContext.onboardingAnswers, {
    prefetchedRegulatoryContext: preloadedRegulatoryContext,
    deepResearchPrefetch,
    includeDataAndDocTools: true,
  });

  const messages: MinimaxChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversation.map(
      (m): MinimaxChatMessage => ({
        role: m.role,
        content: m.content,
      }),
    ),
  ];

  let toolSteps = 0;

  while (toolSteps < MAX_MINIMAX_TOOL_STEPS) {
      const completion = await minimaxChatCompletion({
        model,
        messages,
        tools: ASK_TOOL_DEFINITIONS,
        tool_choice: "auto",
        max_tokens: MAX_COMPLETION_TOKENS,
        temperature: 1,
        reasoning_split: true,
      });

      const assistant = getAssistantMessage(completion);
      const toolCalls = assistant?.tool_calls?.filter(
        (tc) => tc.type === "function" || tc.type === undefined,
      );

      if (toolCalls && toolCalls.length > 0) {
        appendAssistantTurn(messages, assistant ?? {});

        for (const tc of toolCalls) {
          const name = tc.function?.name ?? "";
          const args = tc.function?.arguments ?? "{}";
          const outcome = await executeAskTool(name, args, toolContext);
          let toolOk = true;
          try {
            const parsed = JSON.parse(outcome) as { ok?: boolean };
            if (parsed && typeof parsed === "object" && parsed.ok === false) {
              toolOk = false;
            }
          } catch {
            /* non-JSON tool payload */
          }
          logApiEvent("/api/ask", "tool_executed", {
            tool_name: name,
            user_id: toolContext.userId,
            ok: toolOk,
          });
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: outcome,
          });
        }

        toolSteps += 1;
        continue;
      }

      const content = (assistant?.content ?? "").trim();
      if (content.length > 0) {
        return textResponseStream(assistant?.content ?? "");
      }

      return textResponseStream(
        "I could not produce a text reply. Please try rephrasing your question.",
      );
    }

    const fallback = await minimaxChatCompletion({
      model,
      messages,
      max_tokens: MAX_COMPLETION_TOKENS,
      temperature: 1,
      tool_choice: "none",
      reasoning_split: true,
    });

    const finalText = getAssistantMessage(fallback)?.content ?? "";
    if (finalText.trim().length > 0) {
      return textResponseStream(finalText);
    }

    return textResponseStream(
      "This request needed too many tool steps. Try a simpler question or break it into parts.",
    );
}
