"use client";

import type { Dispatch, SetStateAction } from "react";

import { COUNTRIES } from "../../_lib/constants";
import type { OnboardingAnswers } from "../../_lib/types";
import { SearchableMultiSelect } from "../searchable-multi-select";
import { SectionTitle } from "../section-title";

export function Step0MeaningfulCountries({
  answers,
  setAnswers,
}: {
  answers: OnboardingAnswers;
  setAnswers: Dispatch<SetStateAction<OnboardingAnswers>>;
}) {
  return (
    <>
      <SectionTitle
        title="Which countries do you spend meaningful time in each year?"
        subtitle="Time spent drives tax exposure, residency triggers, and planning opportunities."
      />
      <SearchableMultiSelect
        options={COUNTRIES}
        selected={answers.meaningfulCountries}
        onChange={(value) =>
          setAnswers((prev) => ({ ...prev, meaningfulCountries: value }))
        }
        searchPlaceholder="Search countries"
      />
    </>
  );
}
