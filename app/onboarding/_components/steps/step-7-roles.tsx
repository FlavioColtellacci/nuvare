"use client";

import type { Dispatch, SetStateAction } from "react";

import { ROLE_OPTIONS } from "../../_lib/constants";
import type { OnboardingAnswers } from "../../_lib/types";
import { SectionTitle } from "../section-title";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Step7Roles({
  answers,
  setAnswers,
}: {
  answers: OnboardingAnswers;
  setAnswers: Dispatch<SetStateAction<OnboardingAnswers>>;
}) {
  return (
    <>
      <SectionTitle
        title="What best describes your role?"
        subtitle="Role context helps prioritize compensation, entity, and reporting structures."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {ROLE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              setAnswers((prev) => {
                const roleValue = option.value;
                const nextRoles = prev.roles.includes(roleValue)
                  ? prev.roles.filter((role) => role !== roleValue)
                  : [...prev.roles, roleValue];

                return {
                  ...prev,
                  roles: nextRoles,
                  otherRole: nextRoles.includes("other")
                    ? prev.otherRole
                    : "",
                };
              })
            }
            className={cn(
              "rounded-md border px-4 py-4 text-left text-sm transition-colors hover:border-white/45",
              answers.roles.includes(option.value)
                ? "border-white/65 bg-white/15 text-white"
                : "border-white/20 bg-white/5 text-white/80",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {answers.roles.includes("other") && (
        <Input
          value={answers.otherRole}
          onChange={(event) =>
            setAnswers((prev) => ({
              ...prev,
              otherRole: event.target.value,
            }))
          }
          placeholder="Tell us your role"
          className="h-11"
        />
      )}
    </>
  );
}
