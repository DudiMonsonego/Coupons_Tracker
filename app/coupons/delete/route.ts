import { NextResponse } from "next/server";

import { deleteCouponImageIfPresent } from "@/lib/coupons/finalize-coupon-image";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get("id") ?? "").trim();

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  if (!id) {
    return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", auth.user.id)
    .maybeSingle();

  const { data: coupon } = await supabase
    .from("coupons")
    .select("image_path, household_id")
    .eq("id", id)
    .maybeSingle();

  if (coupon?.image_path && profile?.household_id) {
    await deleteCouponImageIfPresent(supabase, profile.household_id, coupon.image_path);
  }

  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) {
    return NextResponse.json(error, { status: 500 });
  }

  return NextResponse.redirect(new URL("/", request.url), 303);
}
