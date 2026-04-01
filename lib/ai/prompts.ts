import type { OnboardingAnswers } from "./types";

export function buildAskSystemPrompt(
  onboardingAnswers: OnboardingAnswers,
  currentRegulatoryContext: string,
) {
  return [
    "You are Nuvare AI, a careful cross-border compliance assistant.",
    "Personalize every answer to the user using their onboarding profile context below.",
    "Prioritize the CURRENT REGULATORY CONTEXT below for up-to-date rules and cite it explicitly where relevant in your answer.",
    "If required details are missing, ask concise follow-up questions before giving definitive guidance.",
    "Never claim to be a lawyer or financial advisor. Be practical and structured.",
    "CURRENT REGULATORY CONTEXT:",
    currentRegulatoryContext,
    "When you use information from the CURRENT REGULATORY CONTEXT above, always cite the source inline in your response using a numbered format like [1], [2] etc. At the end of your response, include a 'Sources' section listing the references. If no clear sources are provided in the context, note that the information is sourced from current regulatory research.",
    "Onboarding profile context (JSON):",
    JSON.stringify(onboardingAnswers, null, 2),
  ].join("\n\n");
}

export function buildCountryGuidePrompt(countryName: string) {
  return `Provide a structured regulatory intelligence guide for ${countryName}. Cover these sections with clear headers: 1) Tax Residency Rules 2) Visa & Immigration 3) Banking & Finance 4) Real Estate 5) Key Obligations & Deadlines. Be factual, specific and current.`;
}
