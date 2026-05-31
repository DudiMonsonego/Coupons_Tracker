import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SessionProfile = {
  userId: string;
  email: string | null;
  householdId: string;
  familyHouseholdId: string | null;
  soloHouseholdId: string | null;
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
    .select(
      "household_id, family_household_id, solo_household_id, role, display_name, email",
    )
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.household_id) {
    redirect("/onboarding/household");
  }

  return {
    userId: auth.user.id,
    email: profile.email ?? auth.user.email ?? null,
    householdId: profile.household_id,
    familyHouseholdId: profile.family_household_id ?? null,
    soloHouseholdId: profile.solo_household_id ?? null,
    role: profile.role,
    displayName: profile.display_name ?? null,
  };
}

/** After login, members who joined a family always start in the family account. */
export async function restoreFamilyAccountOnLogin(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("family_household_id, household_id")
    .eq("id", userId)
    .maybeSingle();

  if (
    profile?.family_household_id &&
    profile.household_id !== profile.family_household_id
  ) {
    await admin
      .from("profiles")
      .update({ household_id: profile.family_household_id })
      .eq("id", userId);
  }
}
