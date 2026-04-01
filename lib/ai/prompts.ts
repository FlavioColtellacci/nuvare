import type { OnboardingAnswers } from "./types";

export type AskResearchMode = {
  prefetchedRegulatoryContext: string | null;
  /** True when prefetch used `sonar-deep-research` (client deep research toggle). */
  deepResearchPrefetch?: boolean;
  /**
   * MiniMax orchestration: mention deadline, document, and research tools in the system prompt.
   * Anthropic `/api/ask` only exposes `research_regulations` today—leave false there.
   */
  includeDataAndDocTools?: boolean;
};

export function buildAskSystemPrompt(
  onboardingAnswers: OnboardingAnswers,
  research: AskResearchMode,
) {
  const trimmedContext =
    typeof research.prefetchedRegulatoryContext === "string"
      ? research.prefetchedRegulatoryContext.trim()
      : "";
  const hasPreload = trimmedContext.length > 0;
  const deepPrefetch = research.deepResearchPrefetch === true;

  const privacyBlock = [
    "Privacy and external research:",
    "- Never paste or repeat private identifiers from the user’s messages into research tool queries.",
    "- Queries must be abstract: topic + jurisdiction + year. Exclude names, emails, phones, addresses, employer or bank names, government IDs, exact income or account data, and long verbatim user quotes.",
    "- Explain the user’s situation in the chat in your own words; send only neutral regulatory keywords to `research_regulations`.",
  ].join("\n");

  let regulatoryBlock: string;
  if (hasPreload) {
    const citeLine =
      "When you use information from the CURRENT REGULATORY CONTEXT, cite inline with [1], [2], etc. and add a short Sources section. If citations are thin, note that the summary is from live regulatory research.";
    if (deepPrefetch) {
      regulatoryBlock = [
        "A deep regulatory briefing was prefetched for this turn.",
        "Prefer the CURRENT REGULATORY CONTEXT when it matches the question; call `research_regulations` only if the user shifts jurisdiction, topic, or needs fresher or narrower detail.",
        "",
        "CURRENT REGULATORY CONTEXT:",
        trimmedContext,
        "",
        citeLine,
      ].join("\n");
    } else {
      regulatoryBlock = [
        "CURRENT REGULATORY CONTEXT (preloaded for this turn):",
        trimmedContext,
        "",
        citeLine,
      ].join("\n");
    }
  } else {
    regulatoryBlock = [
      "No regulatory briefing was prefetched for this turn (on-demand mode).",
      "Use general knowledge for timeless principles.",
      "When the user needs up-to-date rules, filing deadlines, or jurisdiction-specific law, call `research_regulations` with a short abstract query.",
      "If a tool call fails, say so briefly and continue with safe general guidance.",
    ].join("\n");
  }

  const toolRules = research.includeDataAndDocTools
    ? [
        "Tool usage:",
        "- Use list_deadlines, list_documents, or research_regulations when the user needs their saved data or external regulatory facts.",
        "- Use create_deadline only when the user clearly wants a new deadline saved.",
        "- Confirm destructive or ambiguous write actions in natural language when unsure.",
      ].join("\n")
    : "";

  const parts = [
    "You are Nuvare AI, a careful cross-border compliance assistant.",
    "Personalize answers using the onboarding profile below.",
    regulatoryBlock,
    privacyBlock,
    ...(toolRules ? [toolRules] : []),
    "If required details are missing, ask concise follow-up questions before giving definitive guidance.",
    "Never claim to be a lawyer or financial advisor. Be practical and structured.",
    "Never claim government filings or registrations were submitted on the user’s behalf.",
    "Onboarding profile context (JSON):",
    JSON.stringify(onboardingAnswers, null, 2),
  ];

  return parts.join("\n\n");
}

export function buildCountryGuidePrompt(countryName: string) {
  return `Provide a structured regulatory intelligence guide for ${countryName}. Cover these sections with clear headers: 1) Tax Residency Rules 2) Visa & Immigration 3) Banking & Finance 4) Real Estate 5) Key Obligations & Deadlines. Be factual, specific and current.`;
}
