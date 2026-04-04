/**
 * Structured SSE payloads for POST /api/ask (text/event-stream).
 * Shared between the MiniMax orchestrator and the dashboard client parser.
 */

export type AskStreamToolStart = {
  type: "tool";
  phase: "start";
  id: string;
  name: string;
};

export type AskStreamToolDone = {
  type: "tool";
  phase: "done";
  id: string;
  name: string;
  ok: boolean;
};

export type AskStreamText = { type: "text"; delta: string };
export type AskStreamDone = { type: "done" };
export type AskStreamError = { type: "error"; message: string };

export type AskStreamEvent =
  | AskStreamToolStart
  | AskStreamToolDone
  | AskStreamText
  | AskStreamDone
  | AskStreamError;

export function encodeAskSseEvent(event: AskStreamEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

const TEXT_SSE_CHUNK = 160;

export function encodeAskSseTextChunks(text: string): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < text.length; i += TEXT_SSE_CHUNK) {
    chunks.push(encodeAskSseEvent({ type: "text", delta: text.slice(i, i + TEXT_SSE_CHUNK) }));
  }
  return chunks;
}
