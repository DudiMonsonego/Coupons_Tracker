import { NextResponse } from "next/server";

import { resolveBrandLogoUrl } from "@/lib/brands/logo-url";
import { normalizeCategory } from "@/lib/coupons/categories";
import { finalizeCouponImage } from "@/lib/coupons/finalize-coupon-image";
import { parseMoneyInput } from "@/lib/coupons/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const expiryDate = String(formData.get("expiry_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const tagsCsv = String(formData.get("tags") ?? "").trim();
  const category = normalizeCategory(formData.get("category"));
  const couponValue = parseMoneyInput(formData.get("coupon_value"));
  const couponCost = parseMoneyInput(formData.get("coupon_cost"));
  const brandName = String(formData.get("brand_name") ?? "").trim() || null;
  const logoFromForm = String(formData.get("logo_url") ?? "").trim() || null;
  const brandDomain = String(formData.get("brand_domain") ?? "").trim() || null;
  const logoUrl =
    logoFromForm ??
    resolveBrandLogoUrl({ brandDomain, hasBrandLogo: Boolean(brandName) });
  const draftImagePath = String(formData.get("draft_image_path") ?? "").trim();
  const imageField = formData.get("image");

  const tags = Array.from(
    new Set(
      tagsCsv
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  );

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.household_id) {
    return NextResponse.redirect(new URL("/onboarding/household", request.url), 303);
  }

  if (!title) {
    return NextResponse.redirect(new URL("/coupons", request.url), 303);
  }

  const { data: created, error } = await supabase
    .from("coupons")
    .insert({
      household_id: profile.household_id,
      title,
      code: code || null,
      expiry_date: expiryDate || null,
      notes: notes || null,
      tags,
      category,
      coupon_value: couponValue,
      coupon_cost: couponCost,
      brand_name: brandName,
      logo_url: logoUrl,
    })
    .select("id")
    .single();

  if (error || !created) {
    return NextResponse.json(error ?? { message: "Insert failed" }, { status: 500 });
  }

  try {
    const imagePath = await finalizeCouponImage(supabase, profile.household_id, created.id, {
      draftImagePath: draftImagePath || undefined,
      imageFile: imageField instanceof File ? imageField : undefined,
    });

    if (imagePath) {
      const { error: imgErr } = await supabase
        .from("coupons")
        .update({ image_path: imagePath })
        .eq("id", created.id);
      if (imgErr) {
        return NextResponse.json(imgErr, { status: 500 });
      }
    }
  } catch (imgError) {
    await supabase.from("coupons").delete().eq("id", created.id);
    return NextResponse.json(
      { message: imgError instanceof Error ? imgError.message : "Image upload failed" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(new URL("/?saved=1", request.url), 303);
}
