import type { ChatMessage, OnboardingAnswers } from "./types";

export function normalizeAskMessages(messages: ChatMessage[]) {
  return messages
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

export function extractUserCountries(onboardingAnswers: OnboardingAnswers) {
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
      if (key.trim()) {
        countries.add(key.trim());
      }
    }
  }

  return [...countries];
}

export function getLatestUserQuestion(messages: { role: string; content: string }[]) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") {
      return messages[i].content;
    }
  }
  return messages[messages.length - 1]?.content ?? "";
}
