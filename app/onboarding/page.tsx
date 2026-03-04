"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type DayRange = "0-30" | "31-90" | "91-182" | "183+";
type TriState = "yes" | "no" | "not-sure";
type Relocation = "yes" | "possibly" | "no";

const COUNTRIES = [
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

const DAY_RANGE_OPTIONS: DayRange[] = ["0-30", "31-90", "91-182", "183+"];
const PERMIT_TYPES = [
  "Work visa",
  "Digital nomad visa",
  "Residence permit",
  "Permanent residence",
  "Investor visa",
];
const ABROAD_ITEMS = [
  "Bank accounts",
  "Brokerage accounts",
  "Companies",
  "Trusts",
  "Real estate",
  "None of these",
];
const ONBOARDING_DRAFT_KEY = "nuvare-onboarding-draft-v1";

type OnboardingAnswers = {
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

const INITIAL_ANSWERS: OnboardingAnswers = {
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

function toggleSelection(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function SearchableMultiSelect({
  options,
  selected,
  onChange,
  searchPlaceholder,
}: {
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  searchPlaceholder: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = options.filter((option) =>
    option.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={searchPlaceholder}
        className="h-11"
      />
      <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-white/15 bg-black/35 p-3">
        {filtered.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-white/85 transition-colors hover:bg-white/10"
          >
            <Checkbox
              checked={selected.includes(option)}
              onCheckedChange={() => onChange(toggleSelection(selected, option))}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-white/45">
          Selected: {selected.length}{" "}
          {selected.length === 1 ? "country" : "countries"}
        </p>
      )}
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-4">
      <h1 className="font-editorial text-4xl tracking-tight text-white md:text-5xl">
        {title}
      </h1>
      <p className="max-w-2xl text-sm leading-7 text-white/55">{subtitle}</p>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(INITIAL_ANSWERS);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [q4Search, setQ4Search] = useState("");
  const [pensionSearch, setPensionSearch] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignInMode, setIsSignInMode] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const QUESTION_STEPS = 9;
  const AUTH_STEP = 9;
  const CONFIRMATION_STEP = 10;
  const progress = Math.min((step / CONFIRMATION_STEP) * 100, 100);
  const isAuthStep = step === AUTH_STEP;
  const isConfirmation = step === CONFIRMATION_STEP;

  const q4SelectableCountries = COUNTRIES.filter((country) =>
    country.toLowerCase().includes(q4Search.toLowerCase()),
  );
  const pensionSelectableCountries = COUNTRIES.filter((country) =>
    country.toLowerCase().includes(pensionSearch.toLowerCase()),
  );

  useEffect(() => {
    const draft = window.localStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (!draft) return;

    try {
      const parsed = JSON.parse(draft) as {
        answers?: OnboardingAnswers;
        step?: number;
      };

      if (parsed.answers) setAnswers(parsed.answers);
      if (typeof parsed.step === "number") {
        setStep(Math.min(parsed.step, AUTH_STEP));
      }
    } catch {
      window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    }
  }, [AUTH_STEP]);

  useEffect(() => {
    if (isConfirmation) {
      window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      return;
    }

    window.localStorage.setItem(
      ONBOARDING_DRAFT_KEY,
      JSON.stringify({ answers, step }),
    );
  }, [answers, step, isConfirmation]);

  function stepIsValid(currentStep: number) {
    if (currentStep === 0) return answers.meaningfulCountries.length > 0;
    if (currentStep === 1) {
      if (answers.citizenships.length === 0) return false;
      if (answers.filesTaxesInSpecificCountry === "yes") {
        return answers.taxFilingCountries.length > 0;
      }
      return true;
    }
    if (currentStep === 2) {
      return answers.meaningfulCountries.every(
        (country) => !!answers.daysPerCountry[country],
      );
    }
    if (currentStep === 3) {
      if (answers.noResidencePermits) return true;
      return Object.values(answers.permitsByCountry).some(
        (permitTypes) => permitTypes.length > 0,
      );
    }
    if (currentStep === 4) return answers.abroadAssets.length > 0;
    if (currentStep === 5) {
      if (answers.pensionContributions !== "yes") return true;
      return answers.pensionContributionCountries.length > 0;
    }
    if (currentStep === 6) {
      if (answers.relocationPlan !== "yes") return true;
      return Boolean(answers.relocationFrom && answers.relocationTo);
    }
    if (currentStep === 7) {
      if (answers.roles.length === 0) return false;
      if (answers.roles.includes("other")) return answers.otherRole.trim().length > 0;
      return true;
    }
    if (currentStep === 8) return answers.detailLevel !== "";
    return true;
  }

  const saveAnswersForUser = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Please sign in to continue.");
      }

      const { error } = await supabase.from("user_profiles").upsert(
        {
          user_id: user.id,
          onboarding_answers: answers,
          onboarding_completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (error) {
        throw new Error(error.message);
      }

      setStep(CONFIRMATION_STEP);
      window.setTimeout(() => {
        router.push("/home");
      }, 2400);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save your onboarding profile.";
      setErrorMessage(message);
      setIsFinalizing(false);
      setIsSaving(false);
      setIsAuthLoading(false);
    }
  }, [CONFIRMATION_STEP, answers, router, supabase]);

  async function handleContinue() {
    setErrorMessage("");

    if (!stepIsValid(step)) {
      setErrorMessage("Please complete this step before continuing.");
      return;
    }

    if (step < QUESTION_STEPS - 1) {
      setStep((prev) => prev + 1);
      return;
    }

    setStep(AUTH_STEP);
  }

  async function handleBack() {
    setErrorMessage("");
    if (step > 0 && !isFinalizing) {
      setStep((prev) => prev - 1);
    }
  }

  async function handleOAuthSignUp(provider: "google" | "apple") {
    setErrorMessage("");
    setIsAuthLoading(true);
    const redirectTo = `${window.location.origin}/onboarding`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) {
      setErrorMessage(error.message);
      setIsAuthLoading(false);
    }
  }

  async function handleEmailAuth() {
    setErrorMessage("");
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsAuthLoading(true);
    const authCall = isSignInMode
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });

    const { error } = await authCall;

    if (error) {
      setErrorMessage(error.message);
      setIsAuthLoading(false);
      return;
    }

    // For email sign-up flows where session is not returned immediately,
    // try to create a session explicitly before finalizing.
    if (!isSignInMode) {
      await supabase.auth.signInWithPassword({ email, password });
    }

    setIsFinalizing(true);
    await saveAnswersForUser();
  }

  useEffect(() => {
    if (!isAuthStep || isFinalizing) return;

    let cancelled = false;

    async function maybeFinalize() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!cancelled && user) {
        setErrorMessage("");
        setIsAuthLoading(true);
        setIsFinalizing(true);
        await saveAnswersForUser();
      }
    }

    void maybeFinalize();

    return () => {
      cancelled = true;
    };
  }, [isAuthStep, isFinalizing, saveAnswersForUser, supabase]);

  return (
    <main className="onboarding-bg relative min-h-screen overflow-hidden bg-black text-white">
      <div className="onboarding-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-10 md:px-10">
        <div className="mb-14 space-y-3">
          <Progress value={progress} />
          <p className="text-xs tracking-[0.2em] text-white/45 uppercase">
            Step {Math.min(step + 1, 11)} of 11
          </p>
        </div>

        {isConfirmation ? (
          <section className="question-fade-in flex flex-1 items-center justify-center">
            <div className="space-y-6 text-center">
              <div className="mx-auto h-2 w-2 animate-pulse rounded-full bg-white/70" />
              <h2 className="font-editorial text-4xl text-white md:text-5xl">
                Your intelligence layer is being built
              </h2>
              <p className="text-sm text-white/55">
                Preparing your global profile and routing you to your dashboard.
              </p>
            </div>
          </section>
        ) : isAuthStep ? (
          <section className="question-fade-in flex flex-1 flex-col">
            <div className="space-y-9">
              <SectionTitle
                title="Your intelligence layer is ready."
                subtitle="Create your account to access your personalised dashboard."
              />
              <div className="space-y-4">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => handleOAuthSignUp("google")}
                  disabled={isAuthLoading || isFinalizing}
                  className="h-12 w-full justify-center text-sm"
                >
                  <svg
                    aria-hidden="true"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    className="mr-2"
                  >
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.58-5.14 3.58-8.64Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.86-3c-1.07.72-2.43 1.14-4.07 1.14-3.13 0-5.78-2.12-6.73-4.97H1.29v3.1A12 12 0 0 0 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.27 14.27A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.27v-3.1H1.29A12 12 0 0 0 0 12c0 1.94.46 3.77 1.29 5.37l3.98-3.1Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.76c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.17 15.24 0 12 0A12 12 0 0 0 1.29 6.63l3.98 3.1c.95-2.85 3.6-4.97 6.73-4.97Z"
                    />
                  </svg>
                  Continue with Google
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => handleOAuthSignUp("apple")}
                  disabled={isAuthLoading || isFinalizing}
                  className="h-12 w-full justify-center text-sm"
                >
                  <svg
                    aria-hidden="true"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    className="mr-2 fill-white"
                  >
                    <path d="M16.37 12.79c.03 3.1 2.72 4.13 2.75 4.14-.02.07-.43 1.48-1.41 2.93-.85 1.25-1.74 2.49-3.13 2.52-1.36.03-1.8-.8-3.36-.8-1.56 0-2.05.77-3.33.83-1.34.05-2.36-1.35-3.22-2.6-1.76-2.54-3.1-7.19-1.3-10.31.9-1.56 2.5-2.55 4.24-2.58 1.32-.02 2.57.89 3.36.89.79 0 2.27-1.1 3.83-.94.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.27-2.15 3.94Zm-2.44-7.43c.71-.86 1.19-2.05 1.06-3.24-1.02.04-2.25.68-2.98 1.54-.66.77-1.24 2-1.09 3.18 1.14.09 2.3-.58 3.01-1.48Z" />
                  </svg>
                  Continue with Apple
                </Button>
                <div className="space-y-3 rounded-md border border-white/15 bg-white/5 p-4">
                  <p className="text-xs tracking-[0.15em] text-white/45 uppercase">
                    {isSignInMode
                      ? "Sign in with email"
                      : "Or create an account with email"}
                  </p>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11"
                  />
                  <Button
                    size="lg"
                    onClick={handleEmailAuth}
                    disabled={isAuthLoading || isFinalizing}
                    className="h-11 w-full transform-gpu text-sm transition duration-300 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {isSignInMode ? "Sign in" : "Create Account"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("");
                      setIsSignInMode((prev) => !prev);
                    }}
                    className="text-left text-sm text-white/60 underline underline-offset-4 transition-colors hover:text-white/85"
                  >
                    {isSignInMode
                      ? "Need an account? Create one"
                      : "Already have an account? Sign in"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              {errorMessage && <p className="text-sm text-red-300">{errorMessage}</p>}
              <div className="flex items-center gap-3">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleBack}
                  disabled={isAuthLoading || isFinalizing}
                  className="h-12 min-w-32 border border-white/20 bg-transparent text-white hover:bg-white/10"
                >
                  Back
                </Button>
                {isFinalizing ? (
                  <p className="text-sm text-white/60">Saving your profile...</p>
                ) : null}
              </div>
            </div>
          </section>
        ) : (
          <section key={step} className="question-fade-in flex flex-1 flex-col">
            <div className="space-y-9">
              {step === 0 && (
                <>
                  <SectionTitle
                    title="Which countries do you spend meaningful time in each year?"
                    subtitle="Time spent drives tax exposure, residency triggers, and planning opportunities."
                  />
                  <SearchableMultiSelect
                    options={COUNTRIES}
                    selected={answers.meaningfulCountries}
                    onChange={(value) =>
                      setAnswers((prev) => ({ ...prev, meaningfulCountries: value }))
                    }
                    searchPlaceholder="Search countries"
                  />
                </>
              )}

              {step === 1 && (
                <>
                  <SectionTitle
                    title="What is your citizenship? Do you file taxes in any specific country?"
                    subtitle="Citizenship and filing obligations shape filing complexity and available structures."
                  />
                  <div className="space-y-6">
                    <SearchableMultiSelect
                      options={COUNTRIES}
                      selected={answers.citizenships}
                      onChange={(value) =>
                        setAnswers((prev) => ({ ...prev, citizenships: value }))
                      }
                      searchPlaceholder="Search citizenship countries"
                    />
                    <div className="space-y-3">
                      <p className="text-sm text-white/70">
                        Do you file taxes in a specific country?
                      </p>
                      <div className="flex gap-3">
                        {(["yes", "no"] as const).map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              setAnswers((prev) => ({
                                ...prev,
                                filesTaxesInSpecificCountry: option,
                                taxFilingCountries:
                                  option === "no" ? [] : prev.taxFilingCountries,
                              }))
                            }
                            className={cn(
                              "rounded-md border px-4 py-2 text-sm capitalize transition-all hover:-translate-y-px",
                              answers.filesTaxesInSpecificCountry === option
                                ? "border-white/60 bg-white/15"
                                : "border-white/20 bg-white/5 hover:border-white/40",
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                    {answers.filesTaxesInSpecificCountry === "yes" && (
                      <SearchableMultiSelect
                        options={COUNTRIES}
                        selected={answers.taxFilingCountries}
                        onChange={(value) =>
                          setAnswers((prev) => ({ ...prev, taxFilingCountries: value }))
                        }
                        searchPlaceholder="Search tax filing countries"
                      />
                    )}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <SectionTitle
                    title="Roughly how many days per year in each country?"
                    subtitle="Approximate ranges are enough to estimate tax residency thresholds."
                  />
                  <div className="space-y-5">
                    {answers.meaningfulCountries.map((country) => (
                      <div
                        key={country}
                        className="space-y-3 rounded-md border border-white/15 bg-white/5 p-4"
                      >
                        <p className="text-sm text-white/90">{country}</p>
                        <div className="flex flex-wrap gap-2">
                          {DAY_RANGE_OPTIONS.map((range) => (
                            <button
                              key={range}
                              type="button"
                              onClick={() =>
                                setAnswers((prev) => ({
                                  ...prev,
                                  daysPerCountry: {
                                    ...prev.daysPerCountry,
                                    [country]: range,
                                  },
                                }))
                              }
                              className={cn(
                                "rounded-md border px-3 py-1.5 text-xs transition-colors hover:border-white/50",
                                answers.daysPerCountry[country] === range
                                  ? "border-white/65 bg-white/15"
                                  : "border-white/20 bg-white/5",
                              )}
                            >
                              {range}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <SectionTitle
                    title="Where do you hold residence visas or long-term permits?"
                    subtitle="Permit status changes tax rules, social contributions, and planning paths."
                  />
                  <div className="space-y-6">
                    <label className="flex items-center gap-3 text-sm text-white/75">
                      <Checkbox
                        checked={answers.noResidencePermits}
                        onCheckedChange={(checked) =>
                          setAnswers((prev) => ({
                            ...prev,
                            noResidencePermits: Boolean(checked),
                            permitsByCountry: checked ? {} : prev.permitsByCountry,
                          }))
                        }
                      />
                      I do not hold residence visas or long-term permits.
                    </label>
                    {!answers.noResidencePermits && (
                      <>
                        <Input
                          value={q4Search}
                          onChange={(event) => setQ4Search(event.target.value)}
                          placeholder="Search country to add permit profile"
                        />
                        <div className="max-h-40 overflow-y-auto rounded-md border border-white/15 bg-black/35 p-3">
                          <div className="flex flex-wrap gap-2">
                            {q4SelectableCountries.map((country) => (
                              <button
                                key={country}
                                type="button"
                                onClick={() =>
                                  setAnswers((prev) => ({
                                    ...prev,
                                    permitsByCountry: {
                                      ...prev.permitsByCountry,
                                      [country]:
                                        prev.permitsByCountry[country] ?? [],
                                    },
                                  }))
                                }
                                className="rounded-md border border-white/20 px-3 py-1 text-xs text-white/85 transition-colors hover:border-white/45 hover:bg-white/10"
                              >
                                + {country}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-4">
                          {Object.keys(answers.permitsByCountry).map((country) => (
                            <div
                              key={country}
                              className="rounded-md border border-white/15 bg-white/5 p-4"
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <p className="text-sm text-white/90">{country}</p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAnswers((prev) => {
                                      const nextPermits = { ...prev.permitsByCountry };
                                      delete nextPermits[country];
                                      return { ...prev, permitsByCountry: nextPermits };
                                    })
                                  }
                                  className="text-xs text-white/50 transition-colors hover:text-white/80"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="grid gap-2 md:grid-cols-2">
                                {PERMIT_TYPES.map((permitType) => (
                                  <label
                                    key={permitType}
                                    className="flex items-center gap-3 rounded-md p-2 text-sm text-white/80 transition-colors hover:bg-white/10"
                                  >
                                    <Checkbox
                                      checked={answers.permitsByCountry[
                                        country
                                      ]?.includes(permitType)}
                                      onCheckedChange={() =>
                                        setAnswers((prev) => ({
                                          ...prev,
                                          permitsByCountry: {
                                            ...prev.permitsByCountry,
                                            [country]: toggleSelection(
                                              prev.permitsByCountry[country] ?? [],
                                              permitType,
                                            ),
                                          },
                                        }))
                                      }
                                    />
                                    {permitType}
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <SectionTitle
                    title="Do you have any of these abroad: bank or brokerage accounts, companies, trusts, real estate?"
                    subtitle="Cross-border assets can create reporting and compliance requirements."
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    {ABROAD_ITEMS.map((item) => (
                      <label
                        key={item}
                        className="flex cursor-pointer items-center gap-3 rounded-md border border-white/15 bg-white/5 p-3 text-sm text-white/80 transition-colors hover:bg-white/10"
                      >
                        <Checkbox
                          checked={answers.abroadAssets.includes(item)}
                          onCheckedChange={() =>
                            setAnswers((prev) => {
                              if (item === "None of these") {
                                return {
                                  ...prev,
                                  abroadAssets: prev.abroadAssets.includes(item)
                                    ? []
                                    : [item],
                                };
                              }

                              const withoutNone = prev.abroadAssets.filter(
                                (value) => value !== "None of these",
                              );
                              return {
                                ...prev,
                                abroadAssets: toggleSelection(withoutNone, item),
                              };
                            })
                          }
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </>
              )}

              {step === 5 && (
                <>
                  <SectionTitle
                    title="Do you have any pension, superannuation, or state retirement contributions in any country?"
                    subtitle="Retirement systems can create ongoing reporting obligations and planning considerations."
                  />
                  <div className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                      {(["yes", "no", "not-sure"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              pensionContributions: option,
                              pensionContributionCountries:
                                option === "yes"
                                  ? prev.pensionContributionCountries
                                  : [],
                            }))
                          }
                          className={cn(
                            "rounded-md border px-4 py-2 text-sm capitalize transition-colors hover:border-white/45",
                            answers.pensionContributions === option
                              ? "border-white/65 bg-white/15"
                              : "border-white/20 bg-white/5",
                          )}
                        >
                          {option === "not-sure" ? "Not sure" : option}
                        </button>
                      ))}
                    </div>
                    {answers.pensionContributions === "yes" && (
                      <div className="space-y-3">
                        <Input
                          value={pensionSearch}
                          onChange={(event) => setPensionSearch(event.target.value)}
                          placeholder="Search countries with pension/super contributions"
                        />
                        <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-white/15 bg-black/35 p-3">
                          {pensionSelectableCountries.map((country) => (
                            <label
                              key={country}
                              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-white/85 transition-colors hover:bg-white/10"
                            >
                              <Checkbox
                                checked={answers.pensionContributionCountries.includes(
                                  country,
                                )}
                                onCheckedChange={() =>
                                  setAnswers((prev) => ({
                                    ...prev,
                                    pensionContributionCountries: toggleSelection(
                                      prev.pensionContributionCountries,
                                      country,
                                    ),
                                  }))
                                }
                              />
                              <span>{country}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {step === 6 && (
                <>
                  <SectionTitle
                    title="Planning to change your main base in the next 12-24 months?"
                    subtitle="Expected relocation timelines influence near-term structuring decisions."
                  />
                  <div className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                      {(["yes", "possibly", "no"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              relocationPlan: option,
                              relocationFrom:
                                option === "yes" ? prev.relocationFrom : "",
                              relocationTo:
                                option === "yes" ? prev.relocationTo : "",
                            }))
                          }
                          className={cn(
                            "rounded-md border px-4 py-2 text-sm capitalize transition-colors hover:border-white/45",
                            answers.relocationPlan === option
                              ? "border-white/65 bg-white/15"
                              : "border-white/20 bg-white/5",
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {answers.relocationPlan === "yes" && (
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input
                          placeholder="Current base country"
                          value={answers.relocationFrom}
                          onChange={(event) =>
                            setAnswers((prev) => ({
                              ...prev,
                              relocationFrom: event.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="Target base country"
                          value={answers.relocationTo}
                          onChange={(event) =>
                            setAnswers((prev) => ({
                              ...prev,
                              relocationTo: event.target.value,
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {step === 7 && (
                <>
                  <SectionTitle
                    title="What best describes your role?"
                    subtitle="Role context helps prioritize compensation, entity, and reporting structures."
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      { label: "Employee or executive", value: "employee-executive" },
                      { label: "Founder or owner", value: "founder-owner" },
                      { label: "Investor", value: "investor" },
                      { label: "Retired", value: "retired" },
                      { label: "Other", value: "other" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => {
                            const roleValue =
                              option.value as OnboardingAnswers["roles"][number];
                            const nextRoles = prev.roles.includes(roleValue)
                              ? prev.roles.filter((role) => role !== roleValue)
                              : [...prev.roles, roleValue];

                            return {
                              ...prev,
                              roles: nextRoles,
                              otherRole: nextRoles.includes("other")
                                ? prev.otherRole
                                : "",
                            };
                          })
                        }
                        className={cn(
                          "rounded-md border px-4 py-4 text-left text-sm transition-colors hover:border-white/45",
                          answers.roles.includes(
                            option.value as OnboardingAnswers["roles"][number],
                          )
                            ? "border-white/65 bg-white/15 text-white"
                            : "border-white/20 bg-white/5 text-white/80",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {answers.roles.includes("other") && (
                    <Input
                      value={answers.otherRole}
                      onChange={(event) =>
                        setAnswers((prev) => ({
                          ...prev,
                          otherRole: event.target.value,
                        }))
                      }
                      placeholder="Tell us your role"
                      className="h-11"
                    />
                  )}
                </>
              )}

              {step === 8 && (
                <>
                  <SectionTitle
                    title="What level of detail are you comfortable sharing now?"
                    subtitle="You can always increase detail later as we refine your profile."
                  />
                  <div className="space-y-3">
                    {[
                      {
                        label: "Show me my blind spots",
                        value: "high-level",
                        description:
                          "Surface the obligations I'm most likely missing across my countries.",
                      },
                      {
                        label: "Give me a detailed picture",
                        value: "rough-numbers",
                        description:
                          "Use my approximate numbers to improve the accuracy of my dashboard.",
                      },
                      {
                        label: "Full precision",
                        value: "full-precision",
                        description:
                          "I'll provide exact figures for maximum accuracy.",
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            detailLevel:
                              option.value as OnboardingAnswers["detailLevel"],
                          }))
                        }
                        className={cn(
                          "w-full rounded-md border px-4 py-4 text-left transition-colors hover:border-white/45",
                          answers.detailLevel === option.value
                            ? "border-white/65 bg-white/15"
                            : "border-white/20 bg-white/5",
                        )}
                      >
                        <p className="text-sm text-white">{option.label}</p>
                        <p className="mt-1 text-xs text-white/55">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mt-10 space-y-4">
              {errorMessage && <p className="text-sm text-red-300">{errorMessage}</p>}
              <div className="flex items-center gap-3">
                {step > 0 && (
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={handleBack}
                    disabled={isSaving || isFinalizing}
                    className="h-12 min-w-32 border border-white/20 bg-transparent text-white hover:bg-white/10"
                  >
                    Back
                  </Button>
                )}
                <Button
                  size="lg"
                  onClick={handleContinue}
                  disabled={isSaving || isFinalizing}
                  className="h-12 min-w-40 transform-gpu text-sm tracking-wide transition duration-300 hover:scale-[1.015] active:scale-[0.99]"
                >
                  {isSaving || isFinalizing
                    ? "Saving..."
                    : step === 8
                      ? "Continue"
                      : "Continue"}
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
