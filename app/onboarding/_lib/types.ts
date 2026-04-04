export type DayRange = "0-30" | "31-90" | "91-182" | "183+";
export type TriState = "yes" | "no" | "not-sure";
export type Relocation = "yes" | "possibly" | "no";

export type OnboardingAnswers = {
  meaningfulCountries: string[];
  citizenships: string[];
  filesTaxesInSpecificCountry: "yes" | "no";
  taxFilingCountries: string[];
  daysPerCountry: Record<string, DayRange | undefined>;
  permitsByCountry: Record<string, string[]>;
  noResidencePermits: boolean;
  abroadAssets: string[];
  pensionContributions: TriState;
  pensionContributionCountries: string[];
  relocationPlan: Relocation;
  relocationFrom: string;
  relocationTo: string;
  roles: Array<
    "employee-executive" | "founder-owner" | "investor" | "retired" | "other"
  >;
  otherRole: string;
  detailLevel: "high-level" | "rough-numbers" | "full-precision" | "";
};
