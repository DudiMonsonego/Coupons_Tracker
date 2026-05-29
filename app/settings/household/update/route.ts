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
    return NextResponse.redirect(new URL("/settings/household", request.url), 303);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.household_id) {
    return NextResponse.redirect(new URL("/onboarding/household", request.url), 303);
  }

  if (profile.role !== "owner") {
    return NextResponse.redirect(new URL("/settings/household", request.url), 303);
  }

  // Use admin client to avoid being blocked by missing/incorrect RLS policies.
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("households")
    .update({ name })
    .eq("id", profile.household_id);

  if (error) {
    return NextResponse.json(error, { status: 500 });
  }

  return NextResponse.redirect(
    new URL("/settings/household?saved=1", request.url),
    303,
  );
}

