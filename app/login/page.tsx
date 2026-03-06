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
        <div className="w-full max-w-sm rounded-2xl border border-white/12 bg-[#0b0b0b] p-8">
          <p className="mb-8 text-center text-sm font-light tracking-[0.3em] text-white">
            NUVARE
          </p>

          <h1 className="font-editorial text-2xl text-white">Welcome back</h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
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
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-sm text-white/60">
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
