"use client";

import type { Dispatch, SetStateAction } from "react";

import type { OnboardingAnswers } from "../_lib/types";
import { Step0MeaningfulCountries } from "./steps/step-0-meaningful-countries";
import { Step1CitizenshipTaxes } from "./steps/step-1-citizenship-taxes";
import { Step2DaysPerCountry } from "./steps/step-2-days-per-country";
import { Step3Permits } from "./steps/step-3-permits";
import { Step4AbroadAssets } from "./steps/step-4-abroad-assets";
import { Step5Pension } from "./steps/step-5-pension";
import { Step6Relocation } from "./steps/step-6-relocation";
import { Step7Roles } from "./steps/step-7-roles";
import { Step8DetailLevel } from "./steps/step-8-detail-level";

export function OnboardingQuestionContent({
  step,
  answers,
  setAnswers,
  q4Search,
  setQ4Search,
  pensionSearch,
  setPensionSearch,
}: {
  step: number;
  answers: OnboardingAnswers;
  setAnswers: Dispatch<SetStateAction<OnboardingAnswers>>;
  q4Search: string;
  setQ4Search: (value: string) => void;
  pensionSearch: string;
  setPensionSearch: (value: string) => void;
}) {
  switch (step) {
    case 0:
      return (
        <Step0MeaningfulCountries answers={answers} setAnswers={setAnswers} />
      );
    case 1:
      return (
        <Step1CitizenshipTaxes answers={answers} setAnswers={setAnswers} />
      );
    case 2:
      return <Step2DaysPerCountry answers={answers} setAnswers={setAnswers} />;
    case 3:
      return (
        <Step3Permits
          answers={answers}
          setAnswers={setAnswers}
          q4Search={q4Search}
          setQ4Search={setQ4Search}
        />
      );
    case 4:
      return <Step4AbroadAssets answers={answers} setAnswers={setAnswers} />;
    case 5:
      return (
        <Step5Pension
          answers={answers}
          setAnswers={setAnswers}
          pensionSearch={pensionSearch}
          setPensionSearch={setPensionSearch}
        />
      );
    case 6:
      return <Step6Relocation answers={answers} setAnswers={setAnswers} />;
    case 7:
      return <Step7Roles answers={answers} setAnswers={setAnswers} />;
    case 8:
      return <Step8DetailLevel answers={answers} setAnswers={setAnswers} />;
    default:
      return null;
  }
}
