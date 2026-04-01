"use client";

import type { Dispatch, SetStateAction } from "react";

import { COUNTRIES } from "../../_lib/constants";
import type { OnboardingAnswers } from "../../_lib/types";
import { SearchableMultiSelect } from "../searchable-multi-select";
import { SectionTitle } from "../section-title";
import { cn } from "@/lib/utils";

export function Step1CitizenshipTaxes({
  answers,
  setAnswers,
}: {
  answers: OnboardingAnswers;
  setAnswers: Dispatch<SetStateAction<OnboardingAnswers>>;
}) {
  return (
    <>
      <SectionTitle
        title="What is your citizenship? Do you file taxes in any specific country?"
        subtitle="Citizenship and filing obligations shape filing complexity and available structures."
      />
      <div className="space-y-6">
        <SearchableMultiSelect
          options={COUNTRIES}
          selected={answers.citizenships}
          onChange={(value) =>
            setAnswers((prev) => ({ ...prev, citizenships: value }))
          }
          searchPlaceholder="Search citizenship countries"
        />
        <div className="space-y-3">
          <p className="text-sm text-white/70">
            Do you file taxes in a specific country?
          </p>
          <div className="flex flex-wrap gap-3">
            {(["yes", "no"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  setAnswers((prev) => ({
                    ...prev,
                    filesTaxesInSpecificCountry: option,
                    taxFilingCountries:
                      option === "no" ? [] : prev.taxFilingCountries,
                  }))
                }
                className={cn(
                  "rounded-md border px-4 py-2 text-sm capitalize transition-all hover:-translate-y-px",
                  answers.filesTaxesInSpecificCountry === option
                    ? "border-white/60 bg-white/15"
                    : "border-white/20 bg-white/5 hover:border-white/40",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        {answers.filesTaxesInSpecificCountry === "yes" && (
          <SearchableMultiSelect
            options={COUNTRIES}
            selected={answers.taxFilingCountries}
            onChange={(value) =>
              setAnswers((prev) => ({ ...prev, taxFilingCountries: value }))
            }
            searchPlaceholder="Search tax filing countries"
          />
        )}
      </div>
    </>
  );
}
