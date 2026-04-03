"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import VaultClient from "@/app/vault/vault-client";
import { createClient } from "@/lib/supabase/client";

export default function VaultPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isCancelled) return;
      if (!user) {
        router.push("/onboarding");
        return;
      }

      setUserId(user.id);
      setIsLoading(false);
    }
    void loadUser();
    return () => {
      isCancelled = true;
    };
  }, [router, supabase]);

  if (isLoading || !userId) {
    return null;
  }

  return <VaultClient userId={userId} />;
}
