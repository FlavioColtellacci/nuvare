"use client";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md bg-[#0c0e14] border border-white/10 p-8">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#c4c7c8]/40 hover:text-white text-xs uppercase tracking-widest px-2 py-1 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        <h3 className="text-xl font-black uppercase tracking-tight text-white mb-8">
          Add Deadline
        </h3>

        <div className="space-y-5">
          {/* Title */}
          <div>
            <label
              htmlFor="deadline-title"
              className="text-[10px] uppercase tracking-[0.2em] text-[#c4c7c8] mb-2 block"
            >
              Title
            </label>
            <input
              id="deadline-title"
              type="text"
              value={form.title}
              onChange={(event) =>
                onFormChange((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="e.g. H-1B Visa Extension Filing"
              className="w-full bg-[#1e1f26] border border-white/10 focus:border-white px-4 py-3 text-[#e2e2eb] text-sm placeholder:text-[#c4c7c8]/30 outline-none transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="deadline-category"
              className="text-[10px] uppercase tracking-[0.2em] text-[#c4c7c8] mb-2 block"
            >
              Category
            </label>
            <input
              id="deadline-category"
              type="text"
              value={form.category}
              onChange={(event) =>
                onFormChange((prev) => ({ ...prev, category: event.target.value }))
              }
              placeholder="e.g. Immigration, Tax, Compliance"
              className="w-full bg-[#1e1f26] border border-white/10 focus:border-white px-4 py-3 text-[#e2e2eb] text-sm placeholder:text-[#c4c7c8]/30 outline-none transition-colors"
            />
          </div>

          {/* Date */}
          <div>
            <label
              htmlFor="deadline-date"
              className="text-[10px] uppercase tracking-[0.2em] text-[#c4c7c8] mb-2 block"
            >
              Due Date
            </label>
            <input
              id="deadline-date"
              type="date"
              value={form.date}
              onChange={(event) =>
                onFormChange((prev) => ({ ...prev, date: event.target.value }))
              }
              className="w-full bg-[#1e1f26] border border-white/10 focus:border-white px-4 py-3 text-[#e2e2eb] text-sm outline-none transition-colors [color-scheme:dark]"
            />
          </div>
        </div>

        {errorMessage ? (
          <p className="text-[10px] uppercase tracking-widest text-[#ffb4ab] mt-4">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-8">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="w-full py-4 bg-white text-[#111319] font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Deadline"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 border border-white/10 text-[#c4c7c8] font-bold uppercase tracking-widest text-xs hover:bg-[#1e1f26] transition-all mt-3"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
