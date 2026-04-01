"use client";

import type { Dispatch, SetStateAction } from "react";

import { DETAIL_LEVEL_OPTIONS } from "../../_lib/constants";
import type { OnboardingAnswers } from "../../_lib/types";
import { SectionTitle } from "../section-title";
import { cn } from "@/lib/utils";

export function Step8DetailLevel({
  answers,
  setAnswers,
}: {
  answers: OnboardingAnswers;
  setAnswers: Dispatch<SetStateAction<OnboardingAnswers>>;
}) {
  return (
    <>
      <SectionTitle
        title="What level of detail are you comfortable sharing now?"
        subtitle="You can always increase detail later as we refine your profile."
      />
      <div className="space-y-3">
        {DETAIL_LEVEL_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              setAnswers((prev) => ({
                ...prev,
                detailLevel: option.value,
              }))
            }
            className={cn(
              "w-full rounded-md border px-4 py-4 text-left transition-colors hover:border-white/45",
              answers.detailLevel === option.value
                ? "border-white/65 bg-white/15"
                : "border-white/20 bg-white/5",
            )}
          >
            <p className="text-sm text-white">{option.label}</p>
            <p className="mt-1 text-xs text-white/55">{option.description}</p>
          </button>
        ))}
      </div>
    </>
  );
}
