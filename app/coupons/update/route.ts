import { NextResponse } from "next/server";

import { normalizeCategory } from "@/lib/coupons/categories";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function parseTags(value: string) {
  const tags = value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return Array.from(new Set(tags));
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const expiryDate = String(formData.get("expiry_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const tagsCsv = String(formData.get("tags") ?? "").trim();
  const category = normalizeCategory(formData.get("category"));

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  if (!id || !title) {
    const referer = request.headers.get("referer");
    return NextResponse.redirect(new URL(referer ?? "/dashboard", request.url), 303);
  }

  const { error } = await supabase
    .from("coupons")
    .update({
      title,
      code: code || null,
      expiry_date: expiryDate || null,
      notes: notes || null,
      tags: parseTags(tagsCsv),
      category,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(error, { status: 500 });
  }

  const referer = request.headers.get("referer");
  return NextResponse.redirect(new URL(referer ?? "/dashboard", request.url), 303);
}

