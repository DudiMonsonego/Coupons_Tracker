import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, household_id")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (existingProfile?.household_id) {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }

  const email = auth.user.email ?? "";
  const displayName =
    (auth.user.user_metadata?.display_name as string | undefined) ??
    (auth.user.user_metadata?.full_name as string | undefined) ??
    "";

  const householdName =
    displayName.trim() || email
      ? `המשק בית של ${displayName || email}`
      : "משק בית פרטי";

  const admin = createSupabaseAdminClient();
  const { data: household, error: householdError } = await admin
    .from("households")
    .insert({ name: householdName })
    .select("id")
    .single();

  if (householdError) {
    return NextResponse.json(householdError, { status: 500 });
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: auth.user.id,
      household_id: household.id,
      role: "owner",
      email,
      display_name: displayName || email,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return NextResponse.json(profileError, { status: 500 });
  }

  await admin.from("notification_settings").upsert(
    {
      household_id: household.id,
      remind_days_before: 7,
      email_notifications_enabled: true,
    },
    { onConflict: "household_id" },
  );

  return NextResponse.redirect(new URL("/", request.url), 303);
}

