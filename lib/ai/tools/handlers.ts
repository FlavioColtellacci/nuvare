import type { SupabaseClient } from "@supabase/supabase-js";

import {
  minimizeQueryForExternalResearch,
  runPerplexityRegulatorySearch,
} from "@/lib/ai/perplexity";
import type { OnboardingAnswers } from "@/lib/ai/types";
import type { Database, Json } from "@/lib/database.types";

export type ToolHandlerContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
  onboardingAnswers: OnboardingAnswers;
  perplexityApiKey: string;
};

const TITLE_MAX = 500;
const CATEGORY_MAX = 100;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MEMORY_KEY_MAX = 200;
const MEMORY_VALUE_MAX_BYTES = 16384;
const MEMORY_LIST_DEFAULT = 40;
const MEMORY_LIST_MAX = 80;
const MEMORY_SOURCES = new Set(["onboarding", "chat", "document"]);

function clampLimit(n: unknown, fallback: number, max: number): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(1, Math.floor(n)));
}

function parseJsonArgs(raw: string): Record<string, unknown> {
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Tool arguments must be a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

export async function executeAskTool(
  name: string,
  argsJson: string,
  ctx: ToolHandlerContext,
): Promise<string> {
  let args: Record<string, unknown>;
  try {
    args = parseJsonArgs(argsJson);
  } catch {
    return JSON.stringify({ ok: false, error: "Invalid JSON arguments for tool." });
  }

  try {
    switch (name) {
      case "list_deadlines":
        return await handleListDeadlines(ctx, args);
      case "create_deadline":
        return await handleCreateDeadline(ctx, args);
      case "list_documents":
        return await handleListDocuments(ctx, args);
      case "research_regulations":
        return await handleResearchRegulations(ctx, args);
      case "list_memory_facts":
        return await handleListMemoryFacts(ctx, args);
      case "upsert_memory_fact":
        return await handleUpsertMemoryFact(ctx, args);
      default:
        return JSON.stringify({ ok: false, error: `Unknown tool: ${name}` });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Tool execution failed.";
    return JSON.stringify({ ok: false, error: message });
  }
}

async function handleListDeadlines(
  ctx: ToolHandlerContext,
  args: Record<string, unknown>,
): Promise<string> {
  const limit = clampLimit(args.limit, 30, 50);
  const { data, error } = await ctx.supabase
    .from("deadlines")
    .select("id, title, due_date, category, created_at")
    .eq("user_id", ctx.userId)
    .order("due_date", { ascending: true })
    .limit(limit);

  if (error) {
    return JSON.stringify({ ok: false, error: error.message });
  }
  return JSON.stringify({ ok: true, deadlines: data ?? [] });
}

function validateDueDate(value: string): string | null {
  if (!ISO_DATE.test(value)) return null;
  const d = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return value;
}

async function handleCreateDeadline(
  ctx: ToolHandlerContext,
  args: Record<string, unknown>,
): Promise<string> {
  const titleRaw = typeof args.title === "string" ? args.title.trim() : "";
  if (!titleRaw || titleRaw.length > TITLE_MAX) {
    return JSON.stringify({
      ok: false,
      error: `title is required and must be 1–${TITLE_MAX} characters.`,
    });
  }

  const dueRaw = typeof args.due_date === "string" ? args.due_date.trim() : "";
  const due = validateDueDate(dueRaw);
  if (!due) {
    return JSON.stringify({
      ok: false,
      error: "due_date must be a valid calendar date in YYYY-MM-DD format.",
    });
  }

  let category: string | null = null;
  if (args.category !== undefined && args.category !== null) {
    if (typeof args.category !== "string") {
      return JSON.stringify({ ok: false, error: "category must be a string when provided." });
    }
    const c = args.category.trim();
    if (c.length > CATEGORY_MAX) {
      return JSON.stringify({
        ok: false,
        error: `category must be at most ${CATEGORY_MAX} characters.`,
      });
    }
    category = c.length > 0 ? c : null;
  }

  const { data, error } = await ctx.supabase
    .from("deadlines")
    .insert({
      user_id: ctx.userId,
      title: titleRaw,
      due_date: due,
      category,
    })
    .select("id, title, due_date, category")
    .single();

  if (error) {
    return JSON.stringify({ ok: false, error: error.message });
  }
  return JSON.stringify({ ok: true, deadline: data });
}

function extractedDatesCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") {
    return Object.keys(value as object).length;
  }
  return 0;
}

async function handleListDocuments(
  ctx: ToolHandlerContext,
  args: Record<string, unknown>,
): Promise<string> {
  const limit = clampLimit(args.limit, 20, 50);
  const { data, error } = await ctx.supabase
    .from("documents")
    .select("id, file_name, processing_status, extracted_dates")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return JSON.stringify({ ok: false, error: error.message });
  }

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    file_name: row.file_name,
    processing_status: row.processing_status,
    extracted_dates_count: extractedDatesCount(row.extracted_dates),
  }));

  return JSON.stringify({ ok: true, documents: rows });
}

async function handleResearchRegulations(
  ctx: ToolHandlerContext,
  args: Record<string, unknown>,
): Promise<string> {
  const query = typeof args.query === "string" ? args.query.trim() : "";
  const topic = minimizeQueryForExternalResearch(query);
  if (!topic) {
    return JSON.stringify({
      ok: false,
      error:
        "Provide a short abstract regulatory topic only (no PII). Example: “Portugal tax residency statutory rules 2026”.",
    });
  }

  const deepResearch = args.deep_research === true;
  const countries = extractCountriesForResearch(ctx.onboardingAnswers);

  try {
    const context = await runPerplexityRegulatorySearch({
      topicLine: topic,
      countries,
      apiKey: ctx.perplexityApiKey,
      model: deepResearch ? "sonar-deep-research" : "sonar",
    });
    return JSON.stringify({
      ok: true,
      context,
      deep_research: deepResearch,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Research failed.";
    return JSON.stringify({ ok: false, error: message });
  }
}

function jsonByteLength(value: Json): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function toMemoryJsonValue(raw: unknown): Json | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") {
    return raw;
  }
  if (Array.isArray(raw)) {
    return raw as Json;
  }
  if (typeof raw === "object") {
    return raw as Json;
  }
  return null;
}

async function handleListMemoryFacts(
  ctx: ToolHandlerContext,
  args: Record<string, unknown>,
): Promise<string> {
  const limit = clampLimit(args.limit, MEMORY_LIST_DEFAULT, MEMORY_LIST_MAX);
  const { data, error } = await ctx.supabase
    .from("user_agent_memory")
    .select("key, value, source, updated_at")
    .eq("user_id", ctx.userId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    return JSON.stringify({ ok: false, error: error.message });
  }
  return JSON.stringify({ ok: true, facts: data ?? [] });
}

async function handleUpsertMemoryFact(
  ctx: ToolHandlerContext,
  args: Record<string, unknown>,
): Promise<string> {
  const keyRaw = typeof args.key === "string" ? args.key.trim() : "";
  if (!keyRaw || keyRaw.length > MEMORY_KEY_MAX) {
    return JSON.stringify({
      ok: false,
      error: `key is required and must be 1–${MEMORY_KEY_MAX} characters.`,
    });
  }

  const source = typeof args.source === "string" ? args.source.trim() : "";
  if (!MEMORY_SOURCES.has(source)) {
    return JSON.stringify({
      ok: false,
      error: "source must be one of: onboarding, chat, document.",
    });
  }

  const value = toMemoryJsonValue(args.value);
  if (value === null) {
    return JSON.stringify({
      ok: false,
      error: "value must be JSON-serializable (object, array, string, number, or boolean).",
    });
  }

  if (jsonByteLength(value) > MEMORY_VALUE_MAX_BYTES) {
    return JSON.stringify({
      ok: false,
      error: `value must serialize to at most ${MEMORY_VALUE_MAX_BYTES} bytes.`,
    });
  }

  const { data, error } = await ctx.supabase
    .from("user_agent_memory")
    .upsert(
      {
        user_id: ctx.userId,
        key: keyRaw,
        value,
        source,
      },
      { onConflict: "user_id,key" },
    )
    .select("key, value, source, updated_at")
    .single();

  if (error) {
    return JSON.stringify({ ok: false, error: error.message });
  }
  return JSON.stringify({ ok: true, fact: data });
}

export function extractCountriesForResearch(onboardingAnswers: OnboardingAnswers): string[] {
  const countries = new Set<string>();
  const citizenships = onboardingAnswers.citizenships;
  if (Array.isArray(citizenships)) {
    for (const value of citizenships) {
      if (typeof value === "string" && value.trim()) {
        countries.add(value.trim());
      }
    }
  }
  const permitsByCountry = onboardingAnswers.permitsByCountry;
  if (permitsByCountry && typeof permitsByCountry === "object") {
    for (const key of Object.keys(permitsByCountry as Record<string, unknown>)) {
      if (key.trim()) countries.add(key.trim());
    }
  }
  return [...countries];
}
