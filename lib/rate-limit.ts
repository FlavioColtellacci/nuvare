import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

import { logApiEvent } from "@/lib/log";

/** Max POST /api/ask per user (or per IP if unauthenticated) per window. */
const ASK_REQUESTS = 60;
/** Max vault uploads per user per window. */
const UPLOAD_REQUESTS = 30;
const WINDOW = "1 m";

let sharedRedis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (sharedRedis !== undefined) return sharedRedis;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    sharedRedis = null;
    return null;
  }
  sharedRedis = new Redis({ url, token });
  return sharedRedis;
}

let askRatelimit: Ratelimit | null | undefined;
let uploadRatelimit: Ratelimit | null | undefined;

function getAskRatelimit(): Ratelimit | null {
  if (askRatelimit !== undefined) return askRatelimit;
  const redis = getRedis();
  if (!redis) {
    askRatelimit = null;
    return null;
  }
  askRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(ASK_REQUESTS, WINDOW),
    prefix: "nuvare:ask",
  });
  return askRatelimit;
}

function getUploadRatelimit(): Ratelimit | null {
  if (uploadRatelimit !== undefined) return uploadRatelimit;
  const redis = getRedis();
  if (!redis) {
    uploadRatelimit = null;
    return null;
  }
  uploadRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(UPLOAD_REQUESTS, WINDOW),
    prefix: "nuvare:vault-upload",
  });
  return uploadRatelimit;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export async function enforceAskRateLimit(
  request: Request,
  userId: string | null,
): Promise<NextResponse | null> {
  const ratelimit = getAskRatelimit();
  if (!ratelimit) return null;

  const identifier = userId ?? `ip:${getClientIp(request)}`;
  const result = await ratelimit.limit(identifier);
  await result.pending;

  if (result.success) return null;

  logApiEvent("/api/ask", "rate_limited");

  const retryAfterSec = Math.max(
    1,
    Math.ceil((result.reset - Date.now()) / 1000),
  );

  return NextResponse.json(
    { error: "Too many requests. Try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}

export async function enforceVaultUploadRateLimit(
  userId: string,
): Promise<NextResponse | null> {
  const ratelimit = getUploadRatelimit();
  if (!ratelimit) return null;

  const result = await ratelimit.limit(userId);
  await result.pending;

  if (result.success) return null;

  logApiEvent("/api/vault/upload", "rate_limited");

  const retryAfterSec = Math.max(
    1,
    Math.ceil((result.reset - Date.now()) / 1000),
  );

  return NextResponse.json(
    { error: "Too many uploads. Try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}
