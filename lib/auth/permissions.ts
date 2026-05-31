import type { SessionProfile } from "@/lib/auth/get-session-profile";

/** Only the household owner (manager) may create or revoke invite codes. */
export function canManageFamilyInvites(profile: Pick<SessionProfile, "role">) {
  return profile.role === "owner";
}

export function isOnFamilyAccount(
  profile: Pick<SessionProfile, "householdId" | "familyHouseholdId">,
) {
  return (
    profile.familyHouseholdId != null &&
    profile.householdId === profile.familyHouseholdId
  );
}

export function isOnSoloAccount(
  profile: Pick<SessionProfile, "householdId" | "soloHouseholdId">,
) {
  return (
    profile.soloHouseholdId != null && profile.householdId === profile.soloHouseholdId
  );
}

export function canSwitchAccounts(
  profile: Pick<SessionProfile, "familyHouseholdId">,
) {
  return profile.familyHouseholdId != null;
}
