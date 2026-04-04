import type { Json } from "@/lib/database.types";

/** Narrow slice of onboarding JSON we read in crons (avoids importing app routes). */
export type CronOnboarding = {
  meaningfulCountries?: string[];
  citizenships?: string[];
  filesTaxesInSpecificCountry?: string;
  taxFilingCountries?: string[];
  daysPerCountry?: Record<string, string | undefined>;
  abroadAssets?: string[];
  pensionContributions?: string;
  pensionContributionCountries?: string[];
  relocationPlan?: string;
  relocationFrom?: string;
  relocationTo?: string;
};

export type MemoryRowLite = {
  user_id: string;
  key: string;
  value: Json;
};

const MAX_LINES = 4;
const MAX_MEMORY_SNIPPET = 160;
const MAX_BODY_CHARS = 900;

export function parseOnboardingJson(json: Json | null): CronOnboarding | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return null;
  }
  return json as CronOnboarding;
}

function memoryValueToSnippet(value: Json): string | null {
  if (typeof value === "string") {
    const t = value.trim();
    return t.length > 0 ? truncate(t, MAX_MEMORY_SNIPPET) : null;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, Json>;
    for (const k of ["summary", "text", "note", "value"] as const) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) {
        return truncate(v.trim(), MAX_MEMORY_SNIPPET);
      }
    }
  }
  return null;
}

function truncate(s: string, max: number) {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/**
 * Conservative, non-prescriptive lines derived from onboarding + optional memory.
 * Never implies filings were made or obligations are known.
 */
export function buildProfileInsightLines(
  onboarding: CronOnboarding | null,
  memoryRowsForUser: MemoryRowLite[],
): string[] {
  const lines: string[] = [];

  if (onboarding) {
    if (onboarding.relocationPlan === "yes" || onboarding.relocationPlan === "possibly") {
      const from = (onboarding.relocationFrom ?? "").trim();
      const to = (onboarding.relocationTo ?? "").trim();
      if (from || to) {
        lines.push(
          `You noted a possible move (${[from, to].filter(Boolean).join(" → ")}). Timing and status often drive reporting—confirm details with a qualified adviser when plans are firm. Nuvare does not file anything for you.`,
        );
      } else {
        lines.push(
          "You noted a possible relocation. Cross-border moves can change how residency and reporting are viewed—review with a qualified adviser when your plans are clearer.",
        );
      }
    }

    if (
      onboarding.filesTaxesInSpecificCountry === "yes" &&
      (onboarding.taxFilingCountries?.length ?? 0) > 1
    ) {
      lines.push(
        "You indicated filing taxes in more than one country. It may help to periodically confirm treaty positions and foreign-credit treatment with your adviser.",
      );
    }

    const citizenships = onboarding.citizenships ?? [];
    if (citizenships.filter((c) => typeof c === "string" && c.trim()).length > 1) {
      lines.push(
        "You noted more than one citizenship. How countries treat you can differ—use your dashboard and an adviser to interpret what applies to you.",
      );
    }

    const countries = onboarding.meaningfulCountries ?? [];
    if (countries.length >= 3) {
      lines.push(
        "You track several countries. As travel patterns change, residency thresholds and local rules may deserve a quick review with your adviser.",
      );
    }

    const assets = onboarding.abroadAssets ?? [];
    const hasAssets = assets.some((a) => typeof a === "string" && a && a !== "None of these");
    if (hasAssets) {
      lines.push(
        "You indicated assets outside your home country. Consider whether reporting applies where those assets sit—this is a general reminder only, not advice.",
      );
    }

    const days = onboarding.daysPerCountry ?? {};
    const heavy = Object.entries(days).filter(([, v]) => v === "183+");
    if (heavy.length > 0) {
      const names = heavy.map(([c]) => c).slice(0, 3);
      const suffix = heavy.length > 3 ? ", …" : "";
      lines.push(
        `You indicated extended time in ${names.join(", ")}${suffix}. Long stays can affect residency tests—confirm what applies to you locally or with an adviser.`,
      );
    }

    if (
      onboarding.pensionContributions === "yes" &&
      (onboarding.pensionContributionCountries?.length ?? 0) > 0
    ) {
      lines.push(
        "You noted pension contributions abroad. Treatment can vary by country and treaty—verify with your tax adviser if you are unsure.",
      );
    }
  }

  let memoryUsed = 0;
  for (const row of memoryRowsForUser) {
    if (memoryUsed >= 2) break;
    const snippet = memoryValueToSnippet(row.value);
    if (!snippet) continue;
    lines.push(`From your saved notes (“${row.key}”): ${snippet}`);
    memoryUsed += 1;
  }

  return lines.slice(0, MAX_LINES);
}

export function buildProfileEmailSectionHtml(lines: string[]): string {
  if (lines.length === 0) return "";

  const items = lines
    .map(
      (line) =>
        `<li style="margin:0 0 10px 0;color:#444;font-size:14px;line-height:1.5">${escapeHtml(line)}</li>`,
    )
    .join("");

  return `
  <div style="margin:0 0 28px 0;padding:16px 18px;background:#f4f4f5;border-radius:8px;border:1px solid #e4e4e7">
    <p style="margin:0 0 10px 0;font-size:13px;font-weight:600;color:#18181b">Based on your profile (informational only)</p>
    <ul style="margin:0;padding-left:18px">${items}</ul>
    <p style="margin:12px 0 0 0;font-size:12px;color:#71717a">These are gentle reminders from your onboarding answers and saved notes. They are not legal or tax advice and do not mean any filing was done for you.</p>
  </div>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function profileInsightNotificationBody(lines: string[]): string {
  const joined = lines.join("\n\n");
  return joined.length <= MAX_BODY_CHARS ? joined : `${joined.slice(0, MAX_BODY_CHARS - 20)}…`;
}
