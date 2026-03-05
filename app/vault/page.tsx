import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import VaultClient from "@/app/vault/vault-client";
import Disclaimer from "@/components/Disclaimer";

export const metadata: Metadata = {
  title: "Document Vault - Nuvare",
};

export default async function VaultPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/onboarding");
  }

  return (
    <div>
      <VaultClient userId={user.id} />
      <Disclaimer />
    </div>
  );
}
