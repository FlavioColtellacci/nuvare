"use client";

import type { Dispatch, SetStateAction } from "react";

import { ABROAD_ITEMS } from "../../_lib/constants";
import type { OnboardingAnswers } from "../../_lib/types";
import { toggleSelection } from "../../_lib/utils";
import { SectionTitle } from "../section-title";
import { Checkbox } from "@/components/ui/checkbox";

export function Step4AbroadAssets({
  answers,
  setAnswers,
}: {
  answers: OnboardingAnswers;
  setAnswers: Dispatch<SetStateAction<OnboardingAnswers>>;
}) {
  return (
    <>
      <SectionTitle
        title="Do you have any of these abroad: bank or brokerage accounts, companies, trusts, real estate?"
        subtitle="Cross-border assets can create reporting and compliance requirements."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {ABROAD_ITEMS.map((item) => (
          <label
            key={item}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-white/15 bg-white/5 p-3 text-sm text-white/80 transition-colors hover:bg-white/10"
          >
            <Checkbox
              checked={answers.abroadAssets.includes(item)}
              onCheckedChange={() =>
                setAnswers((prev) => {
                  if (item === "None of these") {
                    return {
                      ...prev,
                      abroadAssets: prev.abroadAssets.includes(item)
                        ? []
                        : [item],
                    };
                  }

                  const withoutNone = prev.abroadAssets.filter(
                    (value) => value !== "None of these",
                  );
                  return {
                    ...prev,
                    abroadAssets: toggleSelection(withoutNone, item),
                  };
                })
              }
            />
            {item}
          </label>
        ))}
      </div>
    </>
  );
}
