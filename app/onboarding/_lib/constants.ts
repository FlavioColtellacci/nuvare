import type { DayRange, OnboardingAnswers } from "./types";

export const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "New Zealand",
  "Ireland",
  "Germany",
  "France",
  "Spain",
  "Portugal",
  "Italy",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Austria",
  "Poland",
  "Czech Republic",
  "United Arab Emirates",
  "Singapore",
  "Hong Kong",
  "Japan",
  "South Korea",
  "India",
  "Thailand",
  "Indonesia",
  "Malaysia",
  "Mexico",
  "Brazil",
  "Argentina",
  "Chile",
  "South Africa",
  "Israel",
  "Turkey",
  "Greece",
  "Saudi Arabia",
  "Qatar",
  "Bahrain",
  "Panama",
  "Monaco",
  "Luxembourg",
  "Cayman Islands",
  "Bermuda",
  "British Virgin Islands",
  "Cyprus",
  "Malta",
];

export const DAY_RANGE_OPTIONS: DayRange[] = ["0-30", "31-90", "91-182", "183+"];

export const PERMIT_TYPES = [
  "Work visa",
  "Digital nomad visa",
  "Residence permit",
  "Permanent residence",
  "Investor visa",
] as const;

export const ABROAD_ITEMS = [
  "Bank accounts",
  "Brokerage accounts",
  "Companies",
  "Trusts",
  "Real estate",
  "None of these",
] as const;

export const ONBOARDING_DRAFT_KEY = "nuvare-onboarding-draft-v1";
export const ONBOARDING_VARIANT_KEY = "nuvare-onboarding-variant-v1";

export type OnboardingVariant = "classic" | "progressive";

export const ONBOARDING_CLASSIC_QUESTION_STEPS = 9;
export const ONBOARDING_PROGRESSIVE_QUESTION_STEPS = 3;
export const ONBOARDING_PROGRESSIVE_RESUME_STEP = 3;

export const ONBOARDING_EXPERIMENT_MODE =
  process.env.NEXT_PUBLIC_ONBOARDING_EXPERIMENT_MODE ?? "split";

export const INITIAL_ANSWERS: OnboardingAnswers = {
  meaningfulCountries: [],
  citizenships: [],
  filesTaxesInSpecificCountry: "no",
  taxFilingCountries: [],
  daysPerCountry: {},
  permitsByCountry: {},
  noResidencePermits: false,
  abroadAssets: [],
  pensionContributions: "not-sure",
  pensionContributionCountries: [],
  relocationPlan: "no",
  relocationFrom: "",
  relocationTo: "",
  roles: [],
  otherRole: "",
  detailLevel: "",
};

export const ROLE_OPTIONS = [
  { label: "Employee or executive", value: "employee-executive" as const },
  { label: "Founder or owner", value: "founder-owner" as const },
  { label: "Investor", value: "investor" as const },
  { label: "Retired", value: "retired" as const },
  { label: "Other", value: "other" as const },
];

export const DETAIL_LEVEL_OPTIONS = [
  {
    label: "Show me my blind spots",
    value: "high-level" as const,
    description:
      "Surface the obligations I'm most likely missing across my countries.",
  },
  {
    label: "Give me a detailed picture",
    value: "rough-numbers" as const,
    description:
      "Use my approximate numbers to improve the accuracy of my dashboard.",
  },
  {
    label: "Full precision",
    value: "full-precision" as const,
    description: "I'll provide exact figures for maximum accuracy.",
  },
] as const;
