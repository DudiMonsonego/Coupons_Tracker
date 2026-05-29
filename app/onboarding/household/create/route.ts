import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  if (!name) {
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
  const { data: household, error: householdError } = await admin
    .from("households")
    .insert({ name })
    .select("id")
    .single();

  if (householdError) {
    return NextResponse.json(householdError, { status: 500 });
  }

  const email = auth.user.email ?? "";
  const displayName =
    (auth.user.user_metadata?.display_name as string | undefined) ??
    (auth.user.user_metadata?.full_name as string | undefined) ??
    email;

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: auth.user.id,
      household_id: household.id,
      role: "owner",
      email,
      display_name: displayName,
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

