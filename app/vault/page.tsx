"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import VaultClient from "@/app/vault/vault-client";
import Disclaimer from "@/components/Disclaimer";
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

  return (
    <main className="min-h-screen flex flex-col bg-black text-white">
      <div className="flex-1">
        {isLoading || !userId ? null : <VaultClient userId={userId} />}
      </div>
      <Disclaimer />
    </main>
  );
}
