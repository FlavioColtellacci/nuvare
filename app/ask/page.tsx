import { redirect } from "next/navigation";

import AskClient from "@/app/ask/ask-client";
import { createClient } from "@/lib/supabase/server";

export default async function AskPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/onboarding");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return <AskClient userEmail={user.email ?? "Signed-in user"} hasProfile={Boolean(profile)} />;
}
