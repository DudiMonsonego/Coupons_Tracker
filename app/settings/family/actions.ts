"use server";

import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sha256Hex } from "@/lib/crypto";

type CreateInviteState =
  | { ok: true; code: string; expiresAt: string }
  | { ok: false; message: string };

export async function createInviteAction(): Promise<CreateInviteState> {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("household_id, role")
    .eq("id", auth.user.id)
    .single();

  if (profileError) {
    return { ok: false, message: "Failed to load profile" };
  }

  if (!profile.household_id) {
    redirect("/onboarding/household");
  }

  if (profile.role !== "owner") {
    return { ok: false, message: "Only the household owner can create invites" };
  }

  const code = randomBytes(18).toString("base64url");
  const tokenHash = sha256Hex(code);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const admin = createSupabaseAdminClient();
  const { error: inviteError } = await admin.from("household_invites").insert({
    household_id: profile.household_id,
    invited_email: "",
    invited_by: auth.user.id,
    status: "pending",
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (inviteError) {
    return { ok: false, message: "Failed to create invite" };
  }

  return { ok: true, code, expiresAt };
}

export type InviteRow = {
  id: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
};

export async function listInvitesAction(): Promise<
  { ok: true; invites: InviteRow[] } | { ok: false; message: string }
> {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.household_id) {
    redirect("/onboarding/household");
  }

  if (profile.role !== "owner") {
    return { ok: false, message: "Only the household owner can manage invites" };
  }

  const admin = createSupabaseAdminClient();
  const { data: invites, error } = await admin
    .from("household_invites")
    .select("id, status, expires_at, created_at, accepted_at")
    .eq("household_id", profile.household_id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return { ok: false, message: "Failed to load invites" };
  }

  return { ok: true, invites: invites ?? [] };
}

export async function revokeInviteAction(inviteId: string): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.household_id) {
    redirect("/onboarding/household");
  }

  if (profile.role !== "owner") {
    return { ok: false, message: "Only the household owner can manage invites" };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("household_invites")
    .update({ status: "revoked" })
    .eq("id", inviteId)
    .eq("household_id", profile.household_id);

  if (error) {
    return { ok: false, message: "Failed to revoke invite" };
  }

  return { ok: true };
}

