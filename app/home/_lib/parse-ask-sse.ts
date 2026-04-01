import type { AskStreamEvent } from "@/lib/ai/ask-stream-events";

/**
 * Incrementally parses `text/event-stream` lines (`data: {...}`).
 * Returns the unterminated tail to carry across decoder chunks.
 */
export function consumeAskSseChunk(
  carry: string,
  chunk: string,
  onEvent: (event: AskStreamEvent) => void,
): string {
  const combined = carry + chunk;
  const lines = combined.split(/\r?\n/);
  const remainder = lines.pop() ?? "";

  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    const payload = line.slice(6).trim();
    if (!payload) continue;
    try {
      const parsed = JSON.parse(payload) as AskStreamEvent;
      if (parsed && typeof parsed === "object" && "type" in parsed) {
        onEvent(parsed);
      }
    } catch {
      // Malformed SSE payload; skip.
    }
  }

  return remainder;
}
