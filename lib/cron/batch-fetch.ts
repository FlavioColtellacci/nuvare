import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/database.types";

import {
  parseOnboardingJson,
  type CronOnboarding,
  type MemoryRowLite,
} from "./profile-alerts";

const IN_CHUNK = 100;

function chunkIds(ids: string[]): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK) {
    out.push(ids.slice(i, i + IN_CHUNK));
  }
  return out;
}

export async function fetchOnboardingByUserId(
  supabase: SupabaseClient<Database>,
  userIds: string[],
): Promise<Map<string, CronOnboarding | null>> {
  const map = new Map<string, CronOnboarding | null>();
  if (userIds.length === 0) return map;

  const unique = [...new Set(userIds)];

  for (const batch of chunkIds(unique)) {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("user_id, onboarding_answers")
      .in("user_id", batch);

    if (error) {
      throw new Error(error.message);
    }

    for (const row of data ?? []) {
      map.set(row.user_id, parseOnboardingJson(row.onboarding_answers as Json | null));
    }
  }

  for (const id of unique) {
    if (!map.has(id)) map.set(id, null);
  }

  return map;
}

/**
 * Latest memory rows per user (by updated_at desc), capped per user for bounded cron work.
 */
export async function fetchRecentMemoryByUserIds(
  supabase: SupabaseClient<Database>,
  userIds: string[],
  maxPerUser: number,
): Promise<Map<string, MemoryRowLite[]>> {
  const result = new Map<string, MemoryRowLite[]>();
  if (userIds.length === 0) return result;

  const unique = [...new Set(userIds)];
  for (const id of unique) {
    result.set(id, []);
  }

  for (const batch of chunkIds(unique)) {
    const fetchLimit = Math.min(2000, Math.max(batch.length * maxPerUser * 6, 48));

    const { data, error } = await supabase
      .from("user_agent_memory")
      .select("user_id, key, value, updated_at")
      .in("user_id", batch)
      .order("updated_at", { ascending: false })
      .limit(fetchLimit);

    if (error) {
      throw new Error(error.message);
    }

    const perUserCount = new Map<string, number>();
    for (const id of batch) {
      perUserCount.set(id, 0);
    }

    for (const row of data ?? []) {
      const uid = row.user_id;
      const n = perUserCount.get(uid) ?? 0;
      if (n >= maxPerUser) continue;

      const list = result.get(uid) ?? [];
      list.push({ user_id: uid, key: row.key, value: row.value });
      result.set(uid, list);
      perUserCount.set(uid, n + 1);
    }
  }

  return result;
}
