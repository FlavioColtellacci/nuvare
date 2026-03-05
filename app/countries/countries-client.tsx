"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { type Country } from "@/app/countries/countries-data";
import Disclaimer from "@/components/Disclaimer";

export default function CountriesClient({ countries }: { countries: Country[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredCountries = useMemo(() => {
    if (!normalizedQuery) return [];
    return countries.filter((country) => country.name.toLowerCase().includes(normalizedQuery));
  }, [countries, normalizedQuery]);

  return (
    <main className="onboarding-bg relative min-h-screen flex flex-col bg-black px-6 py-12 text-white md:px-10">
      <div className="onboarding-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto w-full max-w-4xl flex-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white/70"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <h1 className="font-editorial text-5xl text-white">Country Intelligence</h1>
        <p className="mt-3 text-sm text-white/55">Live regulatory guides for any country in the world.</p>

        <div className="relative mt-10">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search any country…"
            className="h-14 rounded-xl border-white/20 bg-[#090909] pl-12 pr-4 text-base placeholder:text-white/35 focus-visible:border-white/45"
            aria-label="Search countries"
          />
        </div>

        {!normalizedQuery ? (
          <p className="mt-4 text-sm text-white/45">Type a country name to get started.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {filteredCountries.map((country) => (
              <Link
                key={country.slug}
                href={`/countries/${country.slug}`}
                className="flex items-center justify-between rounded-xl border border-white/15 bg-[#0a0a0a] px-5 py-4 transition-colors hover:border-white/35"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl leading-none" aria-hidden="true">
                    {country.flag}
                  </span>
                  <span className="font-editorial text-2xl text-white">{country.name}</span>
                </div>
                <ArrowRight className="h-5 w-5 text-white/70" aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}
      </div>
      <Disclaimer />
    </main>
  );
}
