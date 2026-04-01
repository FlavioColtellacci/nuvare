"use client";

import { Loader2 } from "lucide-react";

import type { DeleteConfirmationState } from "../_lib/types";

type VaultDeleteDialogProps = {
  confirmation: DeleteConfirmationState;
  rememberDeleteChoice: boolean;
  onRememberChange: (checked: boolean) => void;
  isConfirmDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export function VaultDeleteDialog({
  confirmation,
  rememberDeleteChoice,
  onRememberChange,
  isConfirmDeleting,
  onCancel,
  onConfirm,
}: VaultDeleteDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Delete document confirmation"
    >
      <div
        className="mx-auto mt-[15vh] w-[min(92vw,28rem)] rounded-2xl border border-white/20 bg-[#0d0d0d] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-medium text-white">Delete document?</h2>
        <p className="mt-2 text-sm text-zinc-300">
          This will permanently remove {confirmation.fileName} from your vault.
        </p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirmDeleting}
            className="inline-flex h-9 items-center justify-center rounded-md border border-white/25 px-4 text-sm text-white/85 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isConfirmDeleting}
            className="inline-flex h-9 items-center justify-center rounded-md border border-red-200/30 bg-white/95 px-4 text-sm text-red-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isConfirmDeleting ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Delete
              </span>
            ) : (
              "Delete"
            )}
          </button>
        </div>

        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={rememberDeleteChoice}
            onChange={(event) => onRememberChange(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-white/30 bg-black/50"
          />
          Remember my choice
        </label>
      </div>
    </div>
  );
}
