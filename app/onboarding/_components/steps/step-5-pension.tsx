"use client";

import type { Dispatch, SetStateAction } from "react";

import { COUNTRIES } from "../../_lib/constants";
import type { OnboardingAnswers } from "../../_lib/types";
import { toggleSelection } from "../../_lib/utils";
import { SectionTitle } from "../section-title";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Step5Pension({
  answers,
  setAnswers,
  pensionSearch,
  setPensionSearch,
}: {
  answers: OnboardingAnswers;
  setAnswers: Dispatch<SetStateAction<OnboardingAnswers>>;
  pensionSearch: string;
  setPensionSearch: (value: string) => void;
}) {
  const pensionSelectableCountries = COUNTRIES.filter((country) =>
    country.toLowerCase().includes(pensionSearch.toLowerCase()),
  );

  return (
    <>
      <SectionTitle
        title="Do you have any pension, superannuation, or state retirement contributions in any country?"
        subtitle="Retirement systems can create ongoing reporting obligations and planning considerations."
      />
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {(["yes", "no", "not-sure"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() =>
                setAnswers((prev) => ({
                  ...prev,
                  pensionContributions: option,
                  pensionContributionCountries:
                    option === "yes" ? prev.pensionContributionCountries : [],
                }))
              }
              className={cn(
                "rounded-md border px-4 py-2 text-sm capitalize transition-colors hover:border-white/45",
                answers.pensionContributions === option
                  ? "border-white/65 bg-white/15"
                  : "border-white/20 bg-white/5",
              )}
            >
              {option === "not-sure" ? "Not sure" : option}
            </button>
          ))}
        </div>
        {answers.pensionContributions === "yes" && (
          <div className="space-y-3">
            <Input
              value={pensionSearch}
              onChange={(event) => setPensionSearch(event.target.value)}
              placeholder="Search countries with pension/super contributions"
            />
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-white/15 bg-black/35 p-3">
              {pensionSelectableCountries.map((country) => (
                <label
                  key={country}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-white/85 transition-colors hover:bg-white/10"
                >
                  <Checkbox
                    checked={answers.pensionContributionCountries.includes(
                      country,
                    )}
                    onCheckedChange={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        pensionContributionCountries: toggleSelection(
                          prev.pensionContributionCountries,
                          country,
                        ),
                      }))
                    }
                  />
                  <span>{country}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
