"use client";

import { type ComponentPropsWithoutRef, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

const DEFAULT_THINKING_PHRASES = [
  "Analysing your profile...",
  "Reviewing your residency setup...",
  "Preparing your guidance...",
];

const COUNTRY_NAMES = [
  "united arab emirates",
  "united kingdom",
  "united states",
  "australia",
  "canada",
  "singapore",
  "germany",
  "france",
  "spain",
  "portugal",
  "italy",
  "switzerland",
  "ireland",
  "netherlands",
  "india",
  "china",
  "japan",
  "brazil",
  "mexico",
  "south africa",
  "new zealand",
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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

function hasKeyword(text: string, keyword: string) {
  return new RegExp(`\\b${keyword}\\b`, "i").test(text);
}

function hasCountryName(text: string) {
  const lower = text.toLowerCase();
  return COUNTRY_NAMES.some((country) =>
    new RegExp(`\\b${country.replaceAll(" ", "\\s+")}\\b`, "i").test(lower),
  );
}

function getThinkingPhrases(message: string) {
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
  hasProfile,
  onboardingAnswers,
  initialManualDeadlines,
}: {
  userId: string;
  userEmail: string;
  hasProfile: boolean;
  onboardingAnswers: OnboardingAnswers;
  initialManualDeadlines: ManualDeadline[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const thinkingFadeTimeoutRef = useRef<number | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [thinkingPhrases, setThinkingPhrases] = useState(DEFAULT_THINKING_PHRASES);
  const [thinkingPhraseIndex, setThinkingPhraseIndex] = useState(0);
  const [isThinkingPhraseVisible, setIsThinkingPhraseVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "assistant",
      content:
        "Ask anything about your cross-border compliance setup and I will tailor the guidance to your profile.",
    },
  ]);
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

  const chatSessions = useMemo(
    () => [
      { id: "session-1", title: "Residency setup review" },
      { id: "session-2", title: "UAE visa renewal checklist" },
      { id: "session-3", title: "US filing obligations" },
      { id: "session-4", title: "Cross-border income treatment" },
      { id: "session-5", title: "Tax deadline prioritization" },
    ],
    [],
  );

  useEffect(() => {
    if (!feedRef.current) return;
    feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      if (thinkingFadeTimeoutRef.current !== null) {
        window.clearTimeout(thinkingFadeTimeoutRef.current);
      }
      setThinkingPhraseIndex(0);
      setIsThinkingPhraseVisible(true);
      return;
    }

    if (thinkingPhrases.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setIsThinkingPhraseVisible(false);
      if (thinkingFadeTimeoutRef.current !== null) {
        window.clearTimeout(thinkingFadeTimeoutRef.current);
      }
      thinkingFadeTimeoutRef.current = window.setTimeout(() => {
        setThinkingPhraseIndex((prev) => (prev + 1) % thinkingPhrases.length);
        setIsThinkingPhraseVisible(true);
      }, 220);
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
      if (thinkingFadeTimeoutRef.current !== null) {
        window.clearTimeout(thinkingFadeTimeoutRef.current);
      }
    };
  }, [isLoading, thinkingPhrases]);

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.push("/onboarding");
  }

  async function submitQuestion() {
    const question = input.trim();
    if (!question || isLoading) return;

    const nextUserMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: question,
    };

    const nextMessages = [...messages, nextUserMessage];
    const assistantMessageId = createId();
    setMessages([
      ...nextMessages,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      },
    ]);
    setInput("");
    setErrorMessage("");
    setThinkingPhrases(getThinkingPhrases(question));
    setThinkingPhraseIndex(0);
    setIsThinkingPhraseVisible(true);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Unable to generate response.");
      }

      if (!response.body) {
        throw new Error("Streaming response is unavailable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let hasReceivedText = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;

        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;

        hasReceivedText = true;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId
              ? { ...message, content: message.content + chunk }
              : message,
          ),
        );
      }

      const trailingChunk = decoder.decode();
      if (trailingChunk) {
        hasReceivedText = true;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId
              ? { ...message, content: message.content + trailingChunk }
              : message,
          ),
        );
      }

      if (!hasReceivedText) {
        throw new Error("AI returned an empty response.");
      }
    } catch (error) {
      setMessages((prev) =>
        prev.filter((message) => message.id !== assistantMessageId),
      );
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to generate response.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleNewChat() {
    setMessages([
      {
        id: createId(),
        role: "assistant",
        content:
          "Ask anything about your cross-border compliance setup and I will tailor the guidance to your profile.",
      },
    ]);
    setInput("");
    setErrorMessage("");
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
      <div className="relative min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-20 w-[260px] border-r border-white/12 bg-[#070707]/95 backdrop-blur-sm">
          <div className="flex h-full flex-col p-4">
            <p className="font-editorial text-xl tracking-[0.25em] text-[#d9d9d9]">NUVARE</p>
            <Button
              onClick={handleNewChat}
              className="mt-6 h-10 w-full border border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              New Chat
            </Button>

            <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
              <p className="mb-3 text-xs uppercase tracking-[0.16em] text-white/45">
                Past chats
              </p>
              <div className="space-y-2">
                {chatSessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    className="w-full rounded-lg border border-white/12 bg-[#111111] px-3 py-2 text-left text-sm text-white/85 transition-colors hover:bg-white/10"
                  >
                    {session.title}
                  </button>
                ))}
              </div>
            </div>

            <section className="mt-4 border-t border-white/10 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.16em] text-white/45">Deadlines</p>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => {
                    setErrorMessage("");
                    setIsModalOpen(true);
                  }}
                  className="h-8 border border-white/20 bg-transparent px-2 text-xs text-white hover:bg-white/10"
                >
                  Add deadline
                </Button>
              </div>

              {allDeadlines.length === 0 ? (
                <div className="rounded-lg border border-white/12 bg-[#111111] p-3">
                  <p className="text-xs text-white/55">No deadlines tracked yet.</p>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => router.push("/onboarding")}
                    className="mt-3 h-8 w-full border border-white/20 bg-transparent text-xs text-white hover:bg-white/10"
                  >
                    Complete profile
                  </Button>
                </div>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {allDeadlines.map((deadline) => {
                    const days = daysRemaining(deadline.dueDate);
                    return (
                      <article
                        key={deadline.id}
                        className="rounded-lg border border-white/12 bg-[#111111] p-3"
                      >
                        <p className="text-xs text-white/90">
                          {countryFlag(deadline.country)} {deadline.title}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="text-[11px] text-white/50">{formatDate(deadline.dueDate)}</p>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px]",
                              getUrgencyColor(days),
                            )}
                          >
                            {days <= 0 ? "Due now" : `${days}d`}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mt-4 border-t border-white/10 pt-4">
              <p className="truncate text-xs text-white/55">{userEmail}</p>
              <Button
                variant="ghost"
                size="lg"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="mt-2 h-9 w-full justify-start px-2 text-white/80 hover:bg-white/10 hover:text-white"
              >
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </Button>
            </section>
          </div>
        </aside>

        <div className="ml-[260px] flex min-h-screen flex-col">
          <section className="flex h-screen flex-col px-6 py-6 md:px-10">
            {!hasProfile ? (
              <p className="mb-4 text-sm text-amber-300">
                Your profile is incomplete. Answers may be less personalized until onboarding is
                finished.
              </p>
            ) : null}

            <div
              ref={feedRef}
              className="mb-4 flex-1 space-y-4 overflow-y-auto rounded-xl border border-white/12 bg-[#0b0b0b]/70 p-4 md:p-5"
            >
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-auto w-full max-w-3xl rounded-xl border border-white/20 bg-[#161616] p-4"
                      : "mr-auto w-full max-w-3xl rounded-xl border border-white/12 bg-[#111111] p-4"
                  }
                >
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/45">
                    {message.role === "user" ? "You" : "Nuvare AI"}
                  </p>
                  {message.role === "assistant" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }: ComponentPropsWithoutRef<"h1">) => (
                          <h1 className="mb-3 text-lg font-semibold text-white">{children}</h1>
                        ),
                        h2: ({ children }: ComponentPropsWithoutRef<"h2">) => (
                          <h2 className="mb-2 text-base font-semibold text-white">{children}</h2>
                        ),
                        h3: ({ children }: ComponentPropsWithoutRef<"h3">) => (
                          <h3 className="mb-2 text-sm font-semibold text-white">{children}</h3>
                        ),
                        p: ({ children }: ComponentPropsWithoutRef<"p">) => (
                          <p className="mb-2 text-sm leading-6 text-white/90 last:mb-0">{children}</p>
                        ),
                        strong: ({ children }: ComponentPropsWithoutRef<"strong">) => (
                          <strong className="font-semibold text-white">{children}</strong>
                        ),
                        ul: ({ children }: ComponentPropsWithoutRef<"ul">) => (
                          <ul className="mb-2 list-disc space-y-1 pl-5 text-sm text-white/90">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }: ComponentPropsWithoutRef<"ol">) => (
                          <ol className="mb-2 list-decimal space-y-1 pl-5 text-sm text-white/90">
                            {children}
                          </ol>
                        ),
                        li: ({ children }: ComponentPropsWithoutRef<"li">) => <li>{children}</li>,
                        hr: () => <hr className="my-3 border-white/15" />,
                        table: ({ children }: ComponentPropsWithoutRef<"table">) => (
                          <div className="my-2 overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm text-white/90">
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children }: ComponentPropsWithoutRef<"thead">) => (
                          <thead className="bg-white/5 text-white">{children}</thead>
                        ),
                        tbody: ({ children }: ComponentPropsWithoutRef<"tbody">) => (
                          <tbody>{children}</tbody>
                        ),
                        tr: ({ children }: ComponentPropsWithoutRef<"tr">) => (
                          <tr className="border-b border-white/10 last:border-b-0">{children}</tr>
                        ),
                        th: ({ children }: ComponentPropsWithoutRef<"th">) => (
                          <th className="border border-white/10 px-2 py-1.5 font-medium">
                            {children}
                          </th>
                        ),
                        td: ({ children }: ComponentPropsWithoutRef<"td">) => (
                          <td className="border border-white/10 px-2 py-1.5">{children}</td>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-6 text-white/90">
                      {message.content}
                    </p>
                  )}
                  {message.role === "assistant" ? (
                    <p className="mt-4 border-t border-white/10 pt-3 text-xs text-white/45">
                      This is informational only, not legal or financial advice.
                    </p>
                  ) : null}
                </article>
              ))}
              {isLoading ? (
                <p
                  className={cn(
                    "text-sm text-white/50 transition-opacity duration-300",
                    isThinkingPhraseVisible ? "opacity-100" : "opacity-0",
                  )}
                >
                  {thinkingPhrases[thinkingPhraseIndex] ?? DEFAULT_THINKING_PHRASES[0]}
                </p>
              ) : null}
            </div>

            <section className="rounded-xl border border-white/12 bg-[#101010] p-4">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about tax, residency, filing obligations, or compliance deadlines..."
                className="min-h-24 resize-none border-white/15 bg-black/40"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submitQuestion();
                  }
                }}
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-white/45">Press Enter to send, Shift+Enter for new line.</p>
                <Button
                  onClick={() => void submitQuestion()}
                  disabled={isLoading || !input.trim()}
                  className="h-10"
                >
                  {isLoading ? "Thinking..." : "Ask"}
                </Button>
              </div>
              {errorMessage ? <p className="mt-3 text-sm text-red-300">{errorMessage}</p> : null}
            </section>
          </section>
        </div>

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
