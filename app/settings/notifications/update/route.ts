import { NextResponse } from "next/server";

import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const remindDaysBefore = Number(formData.get("remind_days_before") ?? 7);
  const enabled = formData.get("email_notifications_enabled") === "on";

  const session = await getSessionProfile();
  if (session.role !== "owner") {
    return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("notification_settings").upsert(
    {
      household_id: session.householdId,
      remind_days_before:
        Number.isFinite(remindDaysBefore) && remindDaysBefore >= 1 && remindDaysBefore <= 60
          ? remindDaysBefore
          : 7,
      email_notifications_enabled: enabled,
    },
    { onConflict: "household_id" },
  );

  if (error) {
    return NextResponse.json(error, { status: 500 });
  }

  return NextResponse.redirect(new URL("/settings/notifications?saved=1", request.url), 303);
}

