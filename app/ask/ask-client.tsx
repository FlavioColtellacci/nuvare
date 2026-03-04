"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function AskClient({
  userEmail,
  hasProfile,
}: {
  userEmail: string;
  hasProfile: boolean;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const feedRef = useRef<HTMLDivElement | null>(null);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "assistant",
      content:
        "Ask anything about your cross-border compliance setup and I will tailor the guidance to your profile.",
    },
  ]);

  useEffect(() => {
    if (!feedRef.current) return;
    feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages, isLoading]);

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
    setMessages(nextMessages);
    setInput("");
    setErrorMessage("");
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

      const payload = (await response.json()) as { answer?: string };
      const answer = payload.answer?.trim();

      if (!answer) {
        throw new Error("AI returned an empty response.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to generate response.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="onboarding-bg relative min-h-screen overflow-hidden bg-black text-white">
      <div className="onboarding-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 md:px-10">
        <nav className="mb-8 flex items-center justify-between">
          <p className="font-editorial text-xl tracking-[0.25em] text-[#d9d9d9]">NUVARE</p>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-2 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              Dashboard
            </Link>
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

        <section className="mb-4 space-y-2">
          <h1 className="font-editorial text-4xl text-white md:text-5xl">Ask Anything</h1>
          <p className="text-sm text-white/50">
            Personalized answers based on your Nuvare onboarding profile.
          </p>
          {!hasProfile ? (
            <p className="text-sm text-amber-300">
              Your profile is incomplete. Answers may be less personalized until onboarding is
              finished.
            </p>
          ) : null}
        </section>

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
              <p className="whitespace-pre-wrap text-sm leading-6 text-white/90">
                {message.content}
              </p>
              {message.role === "assistant" ? (
                <p className="mt-4 border-t border-white/10 pt-3 text-xs text-white/45">
                  This is informational only, not legal or financial advice.
                </p>
              ) : null}
            </article>
          ))}
          {isLoading ? (
            <p className="text-sm text-white/50">Nuvare AI is thinking...</p>
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
      </div>
    </main>
  );
}
