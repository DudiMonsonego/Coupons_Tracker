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

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("family_household_id, solo_household_id, email, display_name")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.family_household_id) {
    return NextResponse.redirect(new URL("/settings/household", request.url), 303);
  }

  let soloId = profile.solo_household_id;

  if (!soloId) {
    const email = auth.user.email ?? profile.email ?? "";
    const displayName =
      profile.display_name ??
      (auth.user.user_metadata?.full_name as string | undefined) ??
      email;
    const householdName = displayName
      ? `החשבון האישי של ${displayName}`
      : "חשבון אישי";

    const { data: household, error: householdError } = await admin
      .from("households")
      .insert({ name: householdName })
      .select("id")
      .single();

    if (householdError || !household) {
      return NextResponse.json(householdError ?? { message: "Failed" }, { status: 500 });
    }

    soloId = household.id;

    await admin.from("notification_settings").upsert(
      {
        household_id: soloId,
        remind_days_before: 7,
        email_notifications_enabled: true,
      },
      { onConflict: "household_id" },
    );

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        solo_household_id: soloId,
        household_id: soloId,
      })
      .eq("id", auth.user.id);

    if (updateError) {
      return NextResponse.json(updateError, { status: 500 });
    }
  } else {
    const { error: updateError } = await admin
      .from("profiles")
      .update({ household_id: soloId })
      .eq("id", auth.user.id);

    if (updateError) {
      return NextResponse.json(updateError, { status: 500 });
    }
  }

  return NextResponse.redirect(new URL("/settings/household?switched=solo", request.url), 303);
}
