"use client";

import type { Dispatch, SetStateAction } from "react";

import { COUNTRIES, PERMIT_TYPES } from "../../_lib/constants";
import type { OnboardingAnswers } from "../../_lib/types";
import { toggleSelection } from "../../_lib/utils";
import { SectionTitle } from "../section-title";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export function Step3Permits({
  answers,
  setAnswers,
  q4Search,
  setQ4Search,
}: {
  answers: OnboardingAnswers;
  setAnswers: Dispatch<SetStateAction<OnboardingAnswers>>;
  q4Search: string;
  setQ4Search: (value: string) => void;
}) {
  const q4SelectableCountries = COUNTRIES.filter((country) =>
    country.toLowerCase().includes(q4Search.toLowerCase()),
  );

  return (
    <>
      <SectionTitle
        title="Where do you hold residence visas or long-term permits?"
        subtitle="Permit status changes tax rules, social contributions, and planning paths."
      />
      <div className="space-y-6">
        <label className="flex items-center gap-3 text-sm text-white/75">
          <Checkbox
            checked={answers.noResidencePermits}
            onCheckedChange={(checked) =>
              setAnswers((prev) => ({
                ...prev,
                noResidencePermits: Boolean(checked),
                permitsByCountry: checked ? {} : prev.permitsByCountry,
              }))
            }
          />
          I do not hold residence visas or long-term permits.
        </label>
        {!answers.noResidencePermits && (
          <>
            <Input
              value={q4Search}
              onChange={(event) => setQ4Search(event.target.value)}
              placeholder="Search country to add permit profile"
            />
            <div className="max-h-40 overflow-y-auto rounded-md border border-white/15 bg-black/35 p-3">
              <div className="flex flex-wrap gap-2">
                {q4SelectableCountries.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        permitsByCountry: {
                          ...prev.permitsByCountry,
                          [country]: prev.permitsByCountry[country] ?? [],
                        },
                      }))
                    }
                    className="rounded-md border border-white/20 px-3 py-1 text-xs text-white/85 transition-colors hover:border-white/45 hover:bg-white/10"
                  >
                    + {country}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {Object.keys(answers.permitsByCountry).map((country) => (
                <div
                  key={country}
                  className="rounded-md border border-white/15 bg-white/5 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-white/90">{country}</p>
                    <button
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => {
                          const nextPermits = { ...prev.permitsByCountry };
                          delete nextPermits[country];
                          return { ...prev, permitsByCountry: nextPermits };
                        })
                      }
                      className="text-xs text-white/50 transition-colors hover:text-white/80"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {PERMIT_TYPES.map((permitType) => (
                      <label
                        key={permitType}
                        className="flex items-center gap-3 rounded-md p-2 text-sm text-white/80 transition-colors hover:bg-white/10"
                      >
                        <Checkbox
                          checked={answers.permitsByCountry[country]?.includes(
                            permitType,
                          )}
                          onCheckedChange={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              permitsByCountry: {
                                ...prev.permitsByCountry,
                                [country]: toggleSelection(
                                  prev.permitsByCountry[country] ?? [],
                                  permitType,
                                ),
                              },
                            }))
                          }
                        />
                        {permitType}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
