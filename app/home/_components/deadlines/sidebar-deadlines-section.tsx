"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardDeadline } from "@/app/home/_lib/types";
import { daysRemaining, formatDate, getUrgencyColor } from "@/app/home/_lib/format";

type SidebarDeadlinesSectionProps = {
  allDeadlines: DashboardDeadline[];
  onOpenAddModal: () => void;
};

export function SidebarDeadlinesSection({
  allDeadlines,
  onOpenAddModal,
}: SidebarDeadlinesSectionProps) {
  const router = useRouter();

  return (
    <section className="mt-4 border-t border-white/10 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.16em] text-white/45">Deadlines</p>
        <Button
          size="lg"
          variant="secondary"
          onClick={onOpenAddModal}
          className="h-8 border border-white/20 bg-transparent px-2 text-xs text-white hover:bg-white/10"
        >
          Add deadline
        </Button>
      </div>

      {allDeadlines.length === 0 ? (
        <div className="rounded-lg border border-white/12 bg-[#111111] p-3">
          <p className="text-xs text-white/55">No deadlines tracked yet.</p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => router.push("/onboarding")}
            className="mt-3 h-8 w-full border border-white/20 bg-transparent text-xs text-white hover:bg-white/10"
          >
            Complete profile
          </Button>
        </div>
      ) : (
        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
          {allDeadlines.map((deadline) => {
            const days = daysRemaining(deadline.dueDate);
            return (
              <article
                key={deadline.id}
                className="rounded-lg border border-white/12 bg-[#111111] p-3"
              >
                <p className="text-xs text-white/90">{deadline.title}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-white/50">{formatDate(deadline.dueDate)}</p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px]",
                      getUrgencyColor(days),
                    )}
                  >
                    {days <= 0 ? "Due now" : `${days}d`}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
