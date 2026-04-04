"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import type { SubscriptionTier, VaultDocument } from "./types";
import { normalizeDocumentRow, normalizeExtractedDates } from "./utils";

export function useVaultDocuments(userId: string) {
  const supabase = useMemo(() => createClient(), []);
  const pollersRef = useRef<Record<string, number>>({});
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier | null>(
    null,
  );
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const stopPolling = useCallback((documentId: string) => {
    const intervalId = pollersRef.current[documentId];
    if (!intervalId) return;
    window.clearInterval(intervalId);
    delete pollersRef.current[documentId];
  }, []);

  const updateDocumentById = useCallback(
    (documentId: string, updater: (doc: VaultDocument) => VaultDocument) => {
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === documentId ? updater(doc) : doc)),
      );
    },
    [],
  );

  const startPolling = useCallback(
    (documentId: string) => {
      if (pollersRef.current[documentId]) return;

      pollersRef.current[documentId] = window.setInterval(async () => {
        try {
          const response = await fetch(
            `/api/vault/status?documentId=${encodeURIComponent(documentId)}`,
          );
          if (!response.ok) {
            return;
          }

          const payload = (await response.json()) as {
            status?: "pending" | "complete" | "error";
            extracted_dates?: unknown;
          };

          const nextStatus = payload.status;
          if (
            nextStatus !== "pending" &&
            nextStatus !== "complete" &&
            nextStatus !== "error"
          ) {
            return;
          }

          const nextExtractedDates = normalizeExtractedDates(
            payload.extracted_dates,
          );
          updateDocumentById(documentId, (current) => ({
            ...current,
            processing_status: nextStatus,
            extracted_dates: nextExtractedDates,
          }));

          if (nextStatus === "complete" || nextStatus === "error") {
            stopPolling(documentId);
          }
        } catch {
          // Keep polling on transient failures.
        }
      }, 3000);
    },
    [stopPolling, updateDocumentById],
  );

  useEffect(() => {
    return () => {
      Object.values(pollersRef.current).forEach((intervalId) => {
        window.clearInterval(intervalId);
      });
      pollersRef.current = {};
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadVaultState() {
      setIsLoadingDocuments(true);
      setErrorMessage("");

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("subscription_tier")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (profileError) {
        setSubscriptionTier("none");
        setErrorMessage(profileError.message);
        setIsLoadingDocuments(false);
        return;
      }

      const tier = profile?.subscription_tier;
      const normalizedTier: SubscriptionTier =
        tier === "core" || tier === "professional" ? tier : "none";
      setSubscriptionTier(normalizedTier);

      if (normalizedTier !== "professional") {
        setIsLoadingDocuments(false);
        return;
      }

      const { data: docs, error: docsError } = await supabase
        .from("documents")
        .select("id, file_name, file_type, created_at, processing_status, extracted_dates")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (docsError) {
        setErrorMessage(docsError.message);
        setIsLoadingDocuments(false);
        return;
      }

      const normalizedDocs = (docs ?? [])
        .map((row) => normalizeDocumentRow(row as Record<string, unknown>))
        .filter((row): row is VaultDocument => Boolean(row));

      setDocuments(normalizedDocs);
      normalizedDocs
        .filter((doc) => doc.processing_status === "pending")
        .forEach((doc) => startPolling(doc.id));

      setIsLoadingDocuments(false);
    }

    void loadVaultState();

    return () => {
      cancelled = true;
    };
  }, [supabase, userId, startPolling]);

  return {
    subscriptionTier,
    documents,
    setDocuments,
    isLoadingDocuments,
    errorMessage,
    setErrorMessage,
    startPolling,
    stopPolling,
  };
}
