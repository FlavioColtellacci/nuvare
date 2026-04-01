"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DeadlineForm = {
  title: string;
  category: string;
  date: string;
};

type AddDeadlineModalProps = {
  isOpen: boolean;
  form: DeadlineForm;
  onFormChange: (next: DeadlineForm | ((prev: DeadlineForm) => DeadlineForm)) => void;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
  errorMessage: string;
};

export function AddDeadlineModal({
  isOpen,
  form,
  onFormChange,
  onClose,
  onSave,
  isSaving,
  errorMessage,
}: AddDeadlineModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-xl border border-white/15 bg-[#0d0d0d] p-6">
        <h3 className="font-editorial text-2xl text-white">Add deadline</h3>
        <p className="mt-2 text-sm text-white/50">
          Add a custom date to track alongside generated obligations.
        </p>

        <div className="mt-6 space-y-4">
          <Input
            value={form.title}
            onChange={(event) =>
              onFormChange((prev) => ({ ...prev, title: event.target.value }))
            }
            placeholder="Title"
          />
          <Input
            value={form.category}
            onChange={(event) =>
              onFormChange((prev) => ({ ...prev, category: event.target.value }))
            }
            placeholder="Category"
          />
          <Input
            type="date"
            value={form.date}
            onChange={(event) => onFormChange((prev) => ({ ...prev, date: event.target.value }))}
          />
        </div>

        {errorMessage ? <p className="mt-4 text-sm text-red-300">{errorMessage}</p> : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            size="lg"
            variant="secondary"
            onClick={onClose}
            className="h-10 border border-white/20 bg-transparent text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button size="lg" onClick={onSave} disabled={isSaving} className="h-10">
            {isSaving ? "Saving..." : "Save deadline"}
          </Button>
        </div>
      </div>
    </div>
  );
}
