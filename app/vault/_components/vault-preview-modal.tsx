"use client";

import Image from "next/image";

import type { PreviewDocumentState } from "../_lib/types";
import { isImage, isPdf } from "../_lib/utils";

type VaultPreviewModalProps = {
  preview: PreviewDocumentState;
  onClose: () => void;
};

export function VaultPreviewModal({ preview, onClose }: VaultPreviewModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${preview.fileName}`}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label="Close preview"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pointerEvents: "none" }}
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div
        className="absolute inset-x-0 top-4 flex justify-center px-16"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="inline-flex max-w-[90vw] items-center gap-3 rounded-md bg-black/60 px-3 py-1.5 text-xs text-zinc-300">
          <span className="truncate">{preview.fileName}</span>
          {isPdf(preview.fileType) ? (
            <a
              href={preview.signedUrl}
              target="_blank"
              rel="noreferrer"
              className="whitespace-nowrap text-zinc-300 underline underline-offset-2 hover:text-white"
            >
              Open in new tab
            </a>
          ) : null}
        </div>
      </div>

      <div
        className="flex min-h-screen items-center justify-center p-6 pt-20"
        onClick={(event) => event.stopPropagation()}
      >
        {isPdf(preview.fileType) ? (
          <iframe
            src={preview.signedUrl}
            title={preview.fileName}
            className="h-[85vh] w-[90vw] rounded-md border border-white/20 bg-white"
          />
        ) : isImage(preview.fileType) ? (
          <Image
            src={preview.signedUrl}
            alt={preview.fileName}
            width={1200}
            height={1600}
            unoptimized
            className="max-h-screen max-w-3xl object-contain"
          />
        ) : (
          <a
            href={preview.signedUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-zinc-200 underline underline-offset-2 hover:text-white"
          >
            Open document in new tab
          </a>
        )}
      </div>
    </div>
  );
}
