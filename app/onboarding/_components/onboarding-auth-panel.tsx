"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { SectionTitle } from "./section-title";

type OAuthProvider = "google" | "apple";

export function OnboardingAuthPanel({
  email,
  password,
  isSignInMode,
  isAuthLoading,
  isFinalizing,
  errorMessage,
  onEmailChange,
  onPasswordChange,
  onToggleSignInMode,
  onOAuth,
  onEmailAuth,
  onBack,
}: {
  email: string;
  password: string;
  isSignInMode: boolean;
  isAuthLoading: boolean;
  isFinalizing: boolean;
  errorMessage: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onToggleSignInMode: () => void;
  onOAuth: (provider: OAuthProvider) => void;
  onEmailAuth: () => void;
  onBack: () => void;
}) {
  return (
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
            onClick={() => onOAuth("google")}
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
            onClick={() => onOAuth("apple")}
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
              id="onboarding-email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              className="h-11"
              autoComplete="email"
            />
            <label htmlFor="onboarding-email" className="sr-only">
              Email address
            </label>
            <Input
              id="onboarding-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              className="h-11"
              autoComplete={isSignInMode ? "current-password" : "new-password"}
            />
            <label htmlFor="onboarding-password" className="sr-only">
              Password
            </label>
            <Button
              size="lg"
              onClick={onEmailAuth}
              disabled={isAuthLoading || isFinalizing}
              className="h-11 w-full transform-gpu text-sm transition duration-300 hover:scale-[1.01] active:scale-[0.99]"
            >
              {isSignInMode ? "Sign in" : "Create Account"}
            </Button>
            <button
              type="button"
              onClick={onToggleSignInMode}
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
        {errorMessage ? (
          <p className="text-sm text-red-300" role="alert" aria-live="polite">
            {errorMessage}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            size="lg"
            variant="secondary"
            onClick={onBack}
            disabled={isAuthLoading || isFinalizing}
            className="h-11 w-full border border-white/20 bg-transparent text-white hover:bg-white/10 sm:h-12 sm:min-w-32 sm:w-auto"
          >
            Back
          </Button>
          {isFinalizing ? (
            <p className="text-sm text-white/60">Saving your profile...</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
