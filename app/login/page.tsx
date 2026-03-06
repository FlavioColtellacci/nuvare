"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Disclaimer from "@/components/Disclaimer";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleOAuthSignIn(provider: "google" | "apple") {
    setErrorMessage("");
    setIsLoading(true);
    const redirectTo = `${window.location.origin}/home`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    router.push("/home");
  }

  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-white/12 bg-[#0b0b0b] p-8 text-center">
          <span className="font-light text-lg tracking-[0.3em] text-white">NUVARE</span>

          <div className="mt-6 w-full space-y-3">
            <button
              type="button"
              onClick={() => handleOAuthSignIn("google")}
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/8 text-sm text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
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
            </button>
            <button
              type="button"
              onClick={() => handleOAuthSignIn("apple")}
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/8 text-sm text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                className="fill-white"
              >
                <path d="M16.37 12.79c.03 3.1 2.72 4.13 2.75 4.14-.02.07-.43 1.48-1.41 2.93-.85 1.25-1.74 2.49-3.13 2.52-1.36.03-1.8-.8-3.36-.8-1.56 0-2.05.77-3.33.83-1.34.05-2.36-1.35-3.22-2.6-1.76-2.54-3.1-7.19-1.3-10.31.9-1.56 2.5-2.55 4.24-2.58 1.32-.02 2.57.89 3.36.89.79 0 2.27-1.1 3.83-.94.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.27-2.15 3.94Zm-2.44-7.43c.71-.86 1.19-2.05 1.06-3.24-1.02.04-2.25.68-2.98 1.54-.66.77-1.24 2-1.09 3.18 1.14.09 2.3-.58 3.01-1.48Z" />
              </svg>
              Continue with Apple
            </button>
            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-white/15" />
              <span className="text-xs text-white/45">or</span>
              <div className="h-px flex-1 bg-white/15" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="h-11 w-full rounded-md border border-white/20 bg-black/40 px-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-white/45"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="h-11 w-full rounded-md border border-white/20 bg-black/40 px-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-white/45"
            />

            {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}

            <button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full rounded-md bg-white text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/60">
            Don't have an account?{" "}
            <Link
              href="/onboarding"
              className="text-white underline underline-offset-4 transition-colors hover:text-white/85"
            >
              Get started
            </Link>
          </p>
        </div>
      </div>

      <div className="px-6 pb-6">
        <Disclaimer />
      </div>
    </main>
  );
}
