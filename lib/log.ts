type JsonRecord = Record<string, unknown>;

function baseFields(route: string): JsonRecord {
  return {
    ts: new Date().toISOString(),
    route,
  };
}

/**
 * Structured API error logging (no PII). Writes one JSON line to stderr.
 */
export function logApiError(
  route: string,
  err: unknown,
  meta?: JsonRecord,
): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(
    JSON.stringify({
      ...baseFields(route),
      level: "error",
      message,
      ...(stack ? { stack } : {}),
      ...meta,
    }),
  );
}

/**
 * Structured API event logging (no PII). Writes one JSON line to stdout.
 */
export function logApiEvent(
  route: string,
  event: string,
  meta?: JsonRecord,
): void {
  console.log(
    JSON.stringify({
      ...baseFields(route),
      level: "info",
      event,
      ...meta,
    }),
  );
}
