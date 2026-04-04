import { COUNTRY_NAMES, DEFAULT_THINKING_PHRASES } from "./constants";

export function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatRelativeTime(dateString: string) {
  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) {
    return "Just now";
  }

  const elapsedMs = Date.now() - timestamp;
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (elapsedMs < minuteMs) return "Just now";
  if (elapsedMs < hourMs) {
    const minutes = Math.floor(elapsedMs / minuteMs);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  if (elapsedMs < dayMs) {
    const hours = Math.floor(elapsedMs / hourMs);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(elapsedMs / dayMs);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function daysRemaining(dueDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export function getUrgencyColor(days: number) {
  if (days <= 30) {
    return "bg-red-500/20 text-red-300 border border-red-400/30";
  }
  if (days <= 90) {
    return "bg-amber-500/20 text-amber-300 border border-amber-400/30";
  }
  return "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30";
}

export function countryFlag(country: string) {
  const flags: Record<string, string> = {
    "United Arab Emirates": "🇦🇪",
    UAE: "🇦🇪",
    "United Kingdom": "🇬🇧",
    UK: "🇬🇧",
    "United States": "🇺🇸",
    US: "🇺🇸",
    Australia: "🇦🇺",
    Canada: "🇨🇦",
    Singapore: "🇸🇬",
    Germany: "🇩🇪",
    France: "🇫🇷",
    Spain: "🇪🇸",
    Portugal: "🇵🇹",
    Italy: "🇮🇹",
    Switzerland: "🇨🇭",
    Ireland: "🇮🇪",
    Netherlands: "🇳🇱",
  };

  return flags[country] ?? "🌍";
}

function hasKeyword(text: string, keyword: string) {
  return new RegExp(`\\b${keyword}\\b`, "i").test(text);
}

function hasCountryName(text: string) {
  const lower = text.toLowerCase();
  return COUNTRY_NAMES.some((country) =>
    new RegExp(`\\b${country.replaceAll(" ", "\\s+")}\\b`, "i").test(lower),
  );
}

export function getThinkingPhrases(message: string) {
  const phrases: string[] = [];
  const lower = message.toLowerCase();

  if (hasKeyword(lower, "tax") || hasKeyword(lower, "filing")) {
    phrases.push(
      "Cross-referencing your tax profile...",
      "Checking filing obligations...",
      "Calculating your tax exposure...",
    );
  }

  if (
    hasKeyword(lower, "visa") ||
    hasKeyword(lower, "permit") ||
    hasKeyword(lower, "residency")
  ) {
    phrases.push(
      "Checking your visa status...",
      "Reviewing residency requirements...",
      "Analysing permit obligations...",
    );
  }

  if (hasKeyword(lower, "deadline")) {
    phrases.push(
      "Scanning your compliance deadlines...",
      "Checking upcoming obligations...",
      "Reviewing your deadline calendar...",
    );
  }

  if (
    hasKeyword(lower, "pension") ||
    hasKeyword(lower, "super") ||
    hasKeyword(lower, "retirement")
  ) {
    phrases.push(
      "Reviewing your pension obligations...",
      "Checking contribution requirements...",
    );
  }

  if (hasCountryName(lower)) {
    phrases.push(
      "Pulling regulatory data...",
      "Checking cross-border rules...",
      "Reviewing country obligations...",
    );
  }

  return phrases.length > 0 ? phrases : DEFAULT_THINKING_PHRASES;
}

export function stripTrailingDots(text: string) {
  return text.replace(/\.+$/, "");
}
