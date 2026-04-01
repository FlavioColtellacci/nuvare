"use client";

import type { Dispatch, SetStateAction } from "react";

import type { OnboardingAnswers } from "../../_lib/types";
import { SectionTitle } from "../section-title";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Step6Relocation({
  answers,
  setAnswers,
}: {
  answers: OnboardingAnswers;
  setAnswers: Dispatch<SetStateAction<OnboardingAnswers>>;
}) {
  return (
    <>
      <SectionTitle
        title="Planning to change your main base in the next 12-24 months?"
        subtitle="Expected relocation timelines influence near-term structuring decisions."
      />
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {(["yes", "possibly", "no"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() =>
                setAnswers((prev) => ({
                  ...prev,
                  relocationPlan: option,
                  relocationFrom:
                    option === "yes" ? prev.relocationFrom : "",
                  relocationTo: option === "yes" ? prev.relocationTo : "",
                }))
              }
              className={cn(
                "rounded-md border px-4 py-2 text-sm capitalize transition-colors hover:border-white/45",
                answers.relocationPlan === option
                  ? "border-white/65 bg-white/15"
                  : "border-white/20 bg-white/5",
              )}
            >
              {option}
            </button>
          ))}
        </div>
        {answers.relocationPlan === "yes" && (
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Current base country"
              value={answers.relocationFrom}
              onChange={(event) =>
                setAnswers((prev) => ({
                  ...prev,
                  relocationFrom: event.target.value,
                }))
              }
            />
            <Input
              placeholder="Target base country"
              value={answers.relocationTo}
              onChange={(event) =>
                setAnswers((prev) => ({
                  ...prev,
                  relocationTo: event.target.value,
                }))
              }
            />
          </div>
        )}
      </div>
    </>
  );
}
