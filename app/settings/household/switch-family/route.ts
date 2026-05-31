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
    .select("family_household_id")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.family_household_id) {
    return NextResponse.redirect(new URL("/settings/household", request.url), 303);
  }

  const { error } = await admin
    .from("profiles")
    .update({ household_id: profile.family_household_id })
    .eq("id", auth.user.id);

  if (error) {
    return NextResponse.json(error, { status: 500 });
  }

  return NextResponse.redirect(new URL("/settings/household?switched=family", request.url), 303);
}
