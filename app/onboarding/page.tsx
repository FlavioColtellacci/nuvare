"use client";

import { useMemo, useState } from "react";
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
  role:
    | "employee-executive"
    | "founder-owner"
    | "investor"
    | "retired"
    | "other"
    | "";
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
  role: "",
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
    if (currentStep === 7) return answers.role !== "";
    if (currentStep === 8) return answers.detailLevel !== "";
    return true;
  }

  async function saveAnswersForUser() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You need to be signed in to finish onboarding.");
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
        router.push("/dashboard");
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
  }

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

    setIsSaving(true);
    setIsFinalizing(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      setErrorMessage(userError.message);
      setIsSaving(false);
      setIsFinalizing(false);
      return;
    }

    if (user) {
      await saveAnswersForUser();
      return;
    }

    setIsSaving(false);
    setIsFinalizing(false);
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

  async function handleEmailSignUp() {
    setErrorMessage("");
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsAuthLoading(true);
    const redirectTo = `${window.location.origin}/onboarding`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsAuthLoading(false);
      return;
    }

    // If confirm-email is disabled, user may already be signed in.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setIsFinalizing(true);
      await saveAnswersForUser();
      return;
    }

    setIsAuthLoading(false);
    setErrorMessage(
      "Check your email to confirm your account, then return here to continue.",
    );
  }

  async function handleAlreadySignedInContinue() {
    setErrorMessage("");
    setIsAuthLoading(true);
    setIsFinalizing(true);
    await saveAnswersForUser();
  }

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
                title="Create your account to see your personalised intelligence dashboard."
                subtitle="Secure your profile to save your onboarding answers and unlock your dashboard."
              />
              <div className="space-y-4">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => handleOAuthSignUp("google")}
                  disabled={isAuthLoading || isFinalizing}
                  className="h-12 w-full justify-center text-sm"
                >
                  Continue with Google
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => handleOAuthSignUp("apple")}
                  disabled={isAuthLoading || isFinalizing}
                  className="h-12 w-full justify-center text-sm"
                >
                  Continue with Apple
                </Button>
                <div className="space-y-3 rounded-md border border-white/15 bg-white/5 p-4">
                  <p className="text-xs tracking-[0.15em] text-white/45 uppercase">
                    Or create an account with email
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
                    onClick={handleEmailSignUp}
                    disabled={isAuthLoading || isFinalizing}
                    className="h-11 w-full transform-gpu text-sm transition duration-300 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    Create account with email
                  </Button>
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
                <Button
                  size="lg"
                  onClick={handleAlreadySignedInContinue}
                  disabled={isAuthLoading || isFinalizing}
                  className="h-12 min-w-40 transform-gpu text-sm tracking-wide transition duration-300 hover:scale-[1.015] active:scale-[0.99]"
                >
                  {isFinalizing ? "Saving..." : "I am already signed in"}
                </Button>
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
                          setAnswers((prev) => ({
                            ...prev,
                            role: option.value as OnboardingAnswers["role"],
                          }))
                        }
                        className={cn(
                          "rounded-md border px-4 py-4 text-left text-sm transition-colors hover:border-white/45",
                          answers.role === option.value
                            ? "border-white/65 bg-white/15 text-white"
                            : "border-white/20 bg-white/5 text-white/80",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
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
                        label: "High-level risks only",
                        value: "high-level",
                        description:
                          "I prefer broad signals and directional insights for now.",
                      },
                      {
                        label: "Happy to add rough numbers",
                        value: "rough-numbers",
                        description:
                          "I can share approximate values and ranges to improve precision.",
                      },
                      {
                        label: "Full precision",
                        value: "full-precision",
                        description:
                          "I am comfortable providing exact values for maximum accuracy.",
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
