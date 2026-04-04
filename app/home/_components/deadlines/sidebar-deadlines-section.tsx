"use client";

import { useRouter } from "next/navigation";

import type { DashboardDeadline } from "@/app/home/_lib/types";
import { daysRemaining } from "@/app/home/_lib/format";

type SidebarDeadlinesSectionProps = {
  allDeadlines: DashboardDeadline[];
  onOpenAddModal: () => void;
};

function parseDateParts(dateString: string): { day: string; month: string } {
  const date = new Date(dateString);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short", timeZone: "UTC" }).toUpperCase();
  return { day, month };
}

export function SidebarDeadlinesSection({
  allDeadlines,
  onOpenAddModal,
}: SidebarDeadlinesSectionProps) {
  const router = useRouter();

  return (
    <section className="mt-4 border-t border-white/10 pt-4">
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between px-1">
        <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#c4c7c8]">
          Upcoming Obligations
        </p>
      </div>

      {allDeadlines.length === 0 ? (
        <div className="bg-[#0c0e14] border border-white/10 p-4">
          <p className="text-[10px] uppercase tracking-widest text-[#c4c7c8]/60">
            No deadlines tracked yet.
          </p>
          <button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="mt-3 w-full py-3 border border-white/10 text-[#c4c7c8] text-[10px] uppercase tracking-widest hover:bg-[#1e1f26] hover:text-white transition-all"
          >
            Complete profile
          </button>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          {allDeadlines.map((deadline) => {
            const daysUntil = daysRemaining(deadline.dueDate);
            const { day, month } = parseDateParts(deadline.dueDate);

            return (
              <div
                key={deadline.id}
                className={`flex items-center justify-between px-4 py-5 hover:bg-[#282a30] transition-all group ${
                  daysUntil <= 7
                    ? "border-l-4 border-white"
                    : daysUntil <= 30
                      ? "border-l-4 border-white/30"
                      : "border-l-4 border-white/5"
                }`}
              >
                {/* Date block */}
                <div className="text-center w-10 shrink-0">
                  <span className="block text-2xl font-black text-white leading-none">{day}</span>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#c4c7c8]/40">
                    {month}
                  </span>
                </div>

                {/* Title + meta */}
                <div className="flex-1 px-4">
                  <h4 className="text-white font-bold text-sm">{deadline.title}</h4>
                  {deadline.category ? (
                    <p className="text-[9px] text-[#c4c7c8] uppercase tracking-widest mt-0.5">
                      {deadline.category}
                    </p>
                  ) : null}
                </div>

                {/* Status badge */}
                <div className="text-right shrink-0">
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter ${
                      daysUntil <= 0
                        ? "bg-[#33343b] text-white border border-white/20"
                        : daysUntil <= 7
                          ? "bg-[#33343b] text-white border border-white/20"
                          : daysUntil <= 30
                            ? "bg-[#1e1f26] text-[#c4c7c8]"
                            : "bg-[#191b22] text-[#c4c7c8]/40"
                    }`}
                  >
                    {daysUntil <= 0 ? "OVERDUE" : `${daysUntil}D`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add deadline button */}
      <button
        type="button"
        onClick={onOpenAddModal}
        className="mt-3 w-full py-3 border border-white/10 text-[#c4c7c8] text-[10px] uppercase tracking-widest hover:bg-[#1e1f26] hover:text-white transition-all"
      >
        Add deadline
      </button>

      {/* Vault Sync Active indicator */}
      <div className="bg-[#0c0e14] p-4 border border-white/10 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">
            Vault Sync Active
          </span>
        </div>
        <p className="text-[10px] text-[#c4c7c8]/50 leading-relaxed">
          4/4 documents verified
        </p>
      </div>
    </section>
  );
}
