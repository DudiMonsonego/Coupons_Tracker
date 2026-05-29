import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SessionProfile = {
  userId: string;
  email: string | null;
  householdId: string;
  role: "owner" | "member";
  displayName: string | null;
};

export async function getSessionProfile(): Promise<SessionProfile> {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, role, display_name, email")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.household_id) {
    redirect("/onboarding/household");
  }

  return {
    userId: auth.user.id,
    email: profile.email ?? auth.user.email ?? null,
    householdId: profile.household_id,
    role: profile.role,
    displayName: profile.display_name ?? null,
  };
}

