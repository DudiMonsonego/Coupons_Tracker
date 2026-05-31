import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sha256Hex } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const code = String(formData.get("code") ?? "")
    .trim()
    .replace(/\s+/g, "");

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/onboarding/household", request.url), 303);
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, household_id")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (existingProfile?.household_id) {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }

  const admin = createSupabaseAdminClient();
  const tokenHash = sha256Hex(code);

  const { data: invite, error: inviteError } = await admin
    .from("household_invites")
    .select("id, household_id, status, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (inviteError) {
    return NextResponse.json(inviteError, { status: 500 });
  }

  const now = new Date();
  const expiresAt = invite?.expires_at ? new Date(invite.expires_at) : null;
  const isExpired =
    !expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt <= now;

  if (!invite || invite.status !== "pending" || isExpired) {
    return NextResponse.redirect(new URL("/onboarding/household", request.url), 303);
  }

  const email = auth.user.email ?? "";
  const displayName =
    (auth.user.user_metadata?.display_name as string | undefined) ??
    (auth.user.user_metadata?.full_name as string | undefined) ??
    email;

  const { error: profileError } = await admin.from("profiles").insert({
    id: auth.user.id,
    household_id: invite.household_id,
    family_household_id: invite.household_id,
    role: "member",
    email,
    display_name: displayName,
  });

  if (profileError) {
    return NextResponse.json(profileError, { status: 500 });
  }

  const { error: inviteUpdateError } = await admin
    .from("household_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (inviteUpdateError) {
    return NextResponse.json(inviteUpdateError, { status: 500 });
  }

  return NextResponse.redirect(new URL("/", request.url), 303);
}

