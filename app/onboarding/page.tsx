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
  ONBOARDING_CLASSIC_QUESTION_STEPS,
  ONBOARDING_DRAFT_KEY,
  ONBOARDING_EXPERIMENT_MODE,
  ONBOARDING_PROGRESSIVE_QUESTION_STEPS,
  ONBOARDING_PROGRESSIVE_RESUME_STEP,
  ONBOARDING_VARIANT_KEY,
  type OnboardingVariant,
} from "./_lib/constants";
import type { OnboardingAnswers } from "./_lib/types";
import { stepIsValid } from "./_lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(0);
  const [variant, setVariant] = useState<OnboardingVariant>("classic");
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false);
  const [isExtendedResume, setIsExtendedResume] = useState(false);
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
  const isProgressiveMode = variant === "progressive" && !isExtendedResume;
  const questionSteps = isProgressiveMode
    ? ONBOARDING_PROGRESSIVE_QUESTION_STEPS
    : ONBOARDING_CLASSIC_QUESTION_STEPS;
  const authStep = questionSteps;
  const confirmationStep = authStep + 1;
  const totalSteps = confirmationStep + 1;

  const progress = Math.min((step / confirmationStep) * 100, 100);
  const isAuthStep = step === authStep;
  const isConfirmation = step === confirmationStep;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsExtendedResume(params.get("phase") === "extended");
  }, []);

  useEffect(() => {
    function pickExperimentVariant(): OnboardingVariant {
      if (ONBOARDING_EXPERIMENT_MODE === "classic") return "classic";
      if (ONBOARDING_EXPERIMENT_MODE === "progressive") return "progressive";
      return Math.random() < 0.5 ? "progressive" : "classic";
    }

    function getValidVariant(value: string | null | undefined): OnboardingVariant | null {
      if (value === "classic" || value === "progressive") return value;
      return null;
    }

    let resolvedVariant =
      getValidVariant(window.localStorage.getItem(ONBOARDING_VARIANT_KEY)) ??
      pickExperimentVariant();

    const draft = window.localStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft) as {
          answers?: OnboardingAnswers;
          step?: number;
          variant?: OnboardingVariant;
        };

        const draftVariant = getValidVariant(parsed.variant);
        if (draftVariant) {
          resolvedVariant = draftVariant;
        } else if (
          typeof parsed.step === "number" &&
          parsed.step > ONBOARDING_PROGRESSIVE_QUESTION_STEPS
        ) {
          // Existing 11-step drafts should continue in classic mode.
          resolvedVariant = "classic";
        }

        if (parsed.answers) setAnswers(parsed.answers);

        const draftQuestionSteps =
          resolvedVariant === "progressive" && !isExtendedResume
            ? ONBOARDING_PROGRESSIVE_QUESTION_STEPS
            : ONBOARDING_CLASSIC_QUESTION_STEPS;
        const draftAuthStep = draftQuestionSteps;

        if (typeof parsed.step === "number") {
          const nextStep = Math.min(parsed.step, draftAuthStep);
          if (isExtendedResume && nextStep < ONBOARDING_PROGRESSIVE_RESUME_STEP) {
            setStep(ONBOARDING_PROGRESSIVE_RESUME_STEP);
          } else {
            setStep(nextStep);
          }
        } else if (isExtendedResume) {
          setStep(ONBOARDING_PROGRESSIVE_RESUME_STEP);
        }
      } catch {
        window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      }
    } else if (isExtendedResume) {
      resolvedVariant = "classic";
      setStep(ONBOARDING_PROGRESSIVE_RESUME_STEP);
    }

    if (isExtendedResume) {
      resolvedVariant = "classic";
    }

    setVariant(resolvedVariant);
    window.localStorage.setItem(ONBOARDING_VARIANT_KEY, resolvedVariant);
    setHasHydratedDraft(true);
  }, [isExtendedResume]);

  useEffect(() => {
    if (!hasHydratedDraft) return;

    if (isExtendedResume && step < ONBOARDING_PROGRESSIVE_RESUME_STEP) {
      setStep(ONBOARDING_PROGRESSIVE_RESUME_STEP);
    }
  }, [hasHydratedDraft, isExtendedResume, step]);

  useEffect(() => {
    if (!hasHydratedDraft) return;
    if (isConfirmation) {
      window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      return;
    }

    window.localStorage.setItem(
      ONBOARDING_DRAFT_KEY,
      JSON.stringify({ answers, step, variant }),
    );
  }, [answers, step, isConfirmation, variant, hasHydratedDraft]);

  const saveAnswersForUser = useCallback(async () => {
    const isFullProfileCompletion =
      questionSteps === ONBOARDING_CLASSIC_QUESTION_STEPS;

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
          onboarding_completed_at: isFullProfileCompletion
            ? new Date().toISOString()
            : null,
        },
        { onConflict: "user_id" },
      );

      if (error) {
        throw new Error(error.message);
      }

      setStep(confirmationStep);
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
  }, [answers, confirmationStep, questionSteps, router, supabase]);

  async function handleContinue() {
    setErrorMessage("");

    if (!stepIsValid(step, answers)) {
      setErrorMessage("Please complete this step before continuing.");
      return;
    }

    if (step < questionSteps - 1) {
      setStep((prev) => prev + 1);
      return;
    }

    setStep(authStep);
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
            Step {Math.min(step + 1, totalSteps)} of {totalSteps}
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
            isProgressiveMode={isProgressiveMode}
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
                <p className="text-sm text-red-300" role="alert" aria-live="polite">
                  {errorMessage}
                </p>
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
                  className="h-11 w-full transform-gpu text-sm tracking-wide transition duration-300 hover:scale-[1.015] active:scale-[0.99] motion-reduce:transform-none sm:h-12 sm:min-w-40 sm:w-auto"
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
