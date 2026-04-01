"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";

import { OnboardingAuthPanel } from "./_components/onboarding-auth-panel";
import { OnboardingConfirmation } from "./_components/onboarding-confirmation";
import { OnboardingQuestionContent } from "./_components/onboarding-question-content";
import {
  INITIAL_ANSWERS,
  ONBOARDING_AUTH_STEP,
  ONBOARDING_CONFIRMATION_STEP,
  ONBOARDING_DRAFT_KEY,
  ONBOARDING_QUESTION_STEPS,
} from "./_lib/constants";
import type { OnboardingAnswers } from "./_lib/types";
import { stepIsValid } from "./_lib/utils";

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

  const progress = Math.min(
    (step / ONBOARDING_CONFIRMATION_STEP) * 100,
    100,
  );
  const isAuthStep = step === ONBOARDING_AUTH_STEP;
  const isConfirmation = step === ONBOARDING_CONFIRMATION_STEP;

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
        setStep(Math.min(parsed.step, ONBOARDING_AUTH_STEP));
      }
    } catch {
      window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    }
  }, []);

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

      setStep(ONBOARDING_CONFIRMATION_STEP);
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
  }, [answers, router, supabase]);

  async function handleContinue() {
    setErrorMessage("");

    if (!stepIsValid(step, answers)) {
      setErrorMessage("Please complete this step before continuing.");
      return;
    }

    if (step < ONBOARDING_QUESTION_STEPS - 1) {
      setStep((prev) => prev + 1);
      return;
    }

    setStep(ONBOARDING_AUTH_STEP);
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
    <main className="onboarding-bg relative min-h-screen overflow-x-hidden bg-black text-white">
      <div className="onboarding-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-10 sm:px-6 md:px-10">
        <div className="mb-14 space-y-3">
          <Progress value={progress} />
          <p className="text-xs tracking-[0.2em] text-white/45 uppercase">
            Step {Math.min(step + 1, 11)} of 11
          </p>
        </div>

        {isConfirmation ? (
          <OnboardingConfirmation />
        ) : isAuthStep ? (
          <OnboardingAuthPanel
            email={email}
            password={password}
            isSignInMode={isSignInMode}
            isAuthLoading={isAuthLoading}
            isFinalizing={isFinalizing}
            errorMessage={errorMessage}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onToggleSignInMode={() => {
              setErrorMessage("");
              setIsSignInMode((prev) => !prev);
            }}
            onOAuth={handleOAuthSignUp}
            onEmailAuth={handleEmailAuth}
            onBack={handleBack}
          />
        ) : (
          <section key={step} className="question-fade-in flex flex-1 flex-col">
            <div className="space-y-9">
              <OnboardingQuestionContent
                step={step}
                answers={answers}
                setAnswers={setAnswers}
                q4Search={q4Search}
                setQ4Search={setQ4Search}
                pensionSearch={pensionSearch}
                setPensionSearch={setPensionSearch}
              />
            </div>

            <div className="mt-10 space-y-4">
              {errorMessage ? (
                <p className="text-sm text-red-300">{errorMessage}</p>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {step > 0 ? (
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={handleBack}
                    disabled={isSaving || isFinalizing}
                    className="h-11 w-full border border-white/20 bg-transparent text-white hover:bg-white/10 sm:h-12 sm:min-w-32 sm:w-auto"
                  >
                    Back
                  </Button>
                ) : null}
                <Button
                  size="lg"
                  onClick={handleContinue}
                  disabled={isSaving || isFinalizing}
                  className="h-11 w-full transform-gpu text-sm tracking-wide transition duration-300 hover:scale-[1.015] active:scale-[0.99] sm:h-12 sm:min-w-40 sm:w-auto"
                >
                  {isSaving || isFinalizing ? "Saving..." : "Continue"}
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
