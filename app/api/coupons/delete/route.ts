import { NextResponse } from "next/server";

import { deleteCouponImageIfPresent } from "@/lib/coupons/finalize-coupon-image";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { id?: string };
  const id = String(body.id ?? "").trim();

  if (!id) {
    return NextResponse.json({ ok: false, message: "Missing id" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
