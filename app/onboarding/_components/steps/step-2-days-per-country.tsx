"use client";

import type { Dispatch, SetStateAction } from "react";

import { DAY_RANGE_OPTIONS } from "../../_lib/constants";
import type { OnboardingAnswers } from "../../_lib/types";
import { SectionTitle } from "../section-title";
import { cn } from "@/lib/utils";

export function Step2DaysPerCountry({
  answers,
  setAnswers,
}: {
  answers: OnboardingAnswers;
  setAnswers: Dispatch<SetStateAction<OnboardingAnswers>>;
}) {
  return (
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
  );
}
