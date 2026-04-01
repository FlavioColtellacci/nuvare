import type { OnboardingAnswers } from "./types";

export function toggleSelection(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function stepIsValid(currentStep: number, answers: OnboardingAnswers) {
  if (currentStep === 0) return answers.meaningfulCountries.length > 0;
  if (currentStep === 1) {
    if (answers.citizenships.length === 0) return false;
    if (answers.filesTaxesInSpecificCountry === "yes") {
      return answers.taxFilingCountries.length > 0;
    }
    return true;
  }
  if (currentStep === 2) {
    return answers.meaningfulCountries.every(
      (country) => !!answers.daysPerCountry[country],
    );
  }
  if (currentStep === 3) {
    if (answers.noResidencePermits) return true;
    return Object.values(answers.permitsByCountry).some(
      (permitTypes) => permitTypes.length > 0,
    );
  }
  if (currentStep === 4) return answers.abroadAssets.length > 0;
  if (currentStep === 5) {
    if (answers.pensionContributions !== "yes") return true;
    return answers.pensionContributionCountries.length > 0;
  }
  if (currentStep === 6) {
    if (answers.relocationPlan !== "yes") return true;
    return Boolean(answers.relocationFrom && answers.relocationTo);
  }
  if (currentStep === 7) {
    if (answers.roles.length === 0) return false;
    if (answers.roles.includes("other")) return answers.otherRole.trim().length > 0;
    return true;
  }
  if (currentStep === 8) return answers.detailLevel !== "";
  return true;
}
