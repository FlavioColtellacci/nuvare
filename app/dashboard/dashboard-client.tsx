"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type ManualDeadline = {
  id: string;
  title: string;
  country: string;
  dueDate: string;
  notes?: string;
};

type Deadline = {
  id: string;
  title: string;
  country: string;
  dueDate: string;
  notes?: string;
  source: "generated" | "manual";
};

type OnboardingAnswers = {
  citizenships?: string[];
  permitsByCountry?: Record<string, string[]>;
  abroadAssets?: string[];
  manualDeadlines?: ManualDeadline[];
  [key: string]: unknown;
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function todayLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function daysRemaining(dueDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function nextOccurrence(month: number, day: number) {
  const now = new Date();
  const year = now.getFullYear();
  const first = new Date(year, month - 1, day);
  first.setHours(0, 0, 0, 0);
  if (first >= now) return first.toISOString();

  const next = new Date(year + 1, month - 1, day);
  next.setHours(0, 0, 0, 0);
  return next.toISOString();
}

function getUrgencyColor(days: number) {
  if (days <= 30) {
    return "bg-red-500/20 text-red-300 border border-red-400/30";
  }
  if (days <= 90) {
    return "bg-amber-500/20 text-amber-300 border border-amber-400/30";
  }
  return "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30";
}

function countryFlag(country: string) {
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

function normalizeCountry(value: string) {
  if (value === "UAE") return "United Arab Emirates";
  if (value === "UK") return "United Kingdom";
  if (value === "US") return "United States";
  return value;
}

function generateDeadlinesFromAnswers(answers: OnboardingAnswers): Deadline[] {
  const results: Deadline[] = [];
  const citizenships = answers.citizenships ?? [];
  const permitsByCountry = answers.permitsByCountry ?? {};
  const abroadAssets = answers.abroadAssets ?? [];

  if (citizenships.includes("United Kingdom")) {
    results.push({
      id: "uk-self-assessment",
      title: "UK Self Assessment Tax Return",
      country: "United Kingdom",
      dueDate: nextOccurrence(1, 31),
      source: "generated",
    });
  }

  if (citizenships.includes("United States")) {
    results.push({
      id: "us-fbar",
      title: "FBAR Filing Deadline",
      country: "United States",
      dueDate: nextOccurrence(4, 15),
      source: "generated",
    });
  }

  if (citizenships.includes("Australia")) {
    results.push({
      id: "au-tax-return",
      title: "Australian Tax Return",
      country: "Australia",
      dueDate: nextOccurrence(10, 31),
      source: "generated",
    });
  }

  const hasForeignAccounts =
    abroadAssets.includes("Bank accounts") ||
    abroadAssets.includes("Brokerage accounts");
  if (hasForeignAccounts) {
    results.push({
      id: "fatca-8938",
      title: "FATCA Form 8938",
      country: "United States",
      dueDate: nextOccurrence(4, 15),
      source: "generated",
    });
  }

  Object.keys(permitsByCountry).forEach((countryRaw) => {
    const country = normalizeCountry(countryRaw);
    const idBase = country.toLowerCase().replaceAll(" ", "-");

    if (country === "United Arab Emirates") {
      results.push({
        id: `visa-${idBase}`,
        title: "UAE Residence Visa Renewal",
        country,
        dueDate: nextOccurrence(12, 1),
        source: "generated",
      });
      return;
    }

    results.push({
      id: `permit-${idBase}`,
      title: `${country} Residence Permit Review`,
      country,
      dueDate: nextOccurrence(12, 1),
      source: "generated",
    });
  });

  return results;
}

export default function DashboardClient({
  userId,
  userEmail,
  onboardingAnswers,
  initialManualDeadlines,
}: {
  userId: string;
  userEmail: string;
  onboardingAnswers: OnboardingAnswers;
  initialManualDeadlines: ManualDeadline[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [manualDeadlines, setManualDeadlines] =
    useState<ManualDeadline[]>(initialManualDeadlines);
  const [form, setForm] = useState({
    title: "",
    country: "",
    date: "",
    notes: "",
  });

  const generatedDeadlines = useMemo(
    () => generateDeadlinesFromAnswers(onboardingAnswers),
    [onboardingAnswers],
  );

  const allDeadlines = useMemo(() => {
    const manual = manualDeadlines.map((deadline) => ({
      ...deadline,
      source: "manual" as const,
    }));
    return [...generatedDeadlines, ...manual].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
  }, [generatedDeadlines, manualDeadlines]);

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.push("/onboarding");
  }

  async function saveManualDeadlines(nextManualDeadlines: ManualDeadline[]) {
    const nextAnswers = {
      ...onboardingAnswers,
      manualDeadlines: nextManualDeadlines,
    };

    const { error } = await supabase.from("user_profiles").upsert(
      {
        user_id: userId,
        onboarding_answers: nextAnswers,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  async function handleAddDeadline() {
    setErrorMessage("");
    if (!form.title || !form.country || !form.date) {
      setErrorMessage("Please complete title, country, and date.");
      return;
    }

    setIsSavingManual(true);

    try {
      const newDeadline: ManualDeadline = {
        id: crypto.randomUUID(),
        title: form.title.trim(),
        country: form.country.trim(),
        dueDate: form.date,
        notes: form.notes.trim(),
      };

      const nextManualDeadlines = [...manualDeadlines, newDeadline];
      await saveManualDeadlines(nextManualDeadlines);
      setManualDeadlines(nextManualDeadlines);
      setForm({ title: "", country: "", date: "", notes: "" });
      setIsModalOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save deadline.",
      );
    } finally {
      setIsSavingManual(false);
    }
  }

  return (
    <main className="onboarding-bg relative min-h-screen overflow-hidden bg-black text-white">
      <div className="onboarding-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto min-h-screen max-w-6xl px-6 py-8 md:px-10">
        <nav className="mb-16 flex items-center justify-between">
          <p className="font-editorial text-xl tracking-[0.25em] text-[#d9d9d9]">
            NUVARE
          </p>
          <div className="flex items-center gap-3 text-sm">
            <p className="text-white/55">{userEmail}</p>
            <Button
              variant="ghost"
              size="lg"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="h-9 px-3 text-white/80 hover:bg-white/10 hover:text-white"
            >
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </nav>

        <section className="mb-12 space-y-3">
          <h1 className="font-editorial text-4xl text-white md:text-5xl">
            Your compliance dashboard
          </h1>
          <p className="text-sm text-white/50">{todayLabel()}</p>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-2xl text-white">Deadlines</h2>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => {
                setErrorMessage("");
                setIsModalOpen(true);
              }}
              className="h-10 border border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              Add deadline
            </Button>
          </div>

          {allDeadlines.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-[#111111] p-8 text-center">
              <p className="font-editorial text-2xl text-white">
                No deadlines tracked yet
              </p>
              <p className="mt-2 text-sm text-white/55">
                Complete your profile to generate compliance milestones.
              </p>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => router.push("/onboarding")}
                className="mt-6 border border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                Complete profile
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {allDeadlines.map((deadline) => {
                const days = daysRemaining(deadline.dueDate);
                return (
                  <article
                    key={deadline.id}
                    className="rounded-xl border border-white/12 bg-[#111111] p-5"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg text-white">
                          {countryFlag(deadline.country)} {deadline.title}
                        </p>
                        <p className="mt-1 text-xs text-white/45">{deadline.country}</p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs",
                          getUrgencyColor(days),
                        )}
                      >
                        {days <= 0 ? "Due now" : `${days} days`}
                      </span>
                    </div>
                    <p className="text-sm text-white/60">
                      Due date: {formatDate(deadline.dueDate)}
                    </p>
                    <p className="mt-1 text-sm text-white/50">
                      Days remaining: {days <= 0 ? 0 : days}
                    </p>
                    {deadline.notes ? (
                      <p className="mt-2 text-xs text-white/45">{deadline.notes}</p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {isModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-xl rounded-xl border border-white/15 bg-[#0d0d0d] p-6">
              <h3 className="font-editorial text-2xl text-white">Add deadline</h3>
              <p className="mt-2 text-sm text-white/50">
                Add a custom date to track alongside generated obligations.
              </p>

              <div className="mt-6 space-y-4">
                <Input
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Title"
                />
                <Input
                  value={form.country}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, country: event.target.value }))
                  }
                  placeholder="Country"
                />
                <Input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                />
                <Textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Notes"
                  className="min-h-24"
                />
              </div>

              {errorMessage ? (
                <p className="mt-4 text-sm text-red-300">{errorMessage}</p>
              ) : null}

              <div className="mt-6 flex items-center justify-end gap-3">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 border border-white/20 bg-transparent text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  size="lg"
                  onClick={handleAddDeadline}
                  disabled={isSavingManual}
                  className="h-10"
                >
                  {isSavingManual ? "Saving..." : "Save deadline"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
