import { NextResponse } from "next/server";
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

  const { data: current, error: currentError } = await supabase
    .from("coupons")
    .select("id, is_used")
    .eq("id", id)
    .single();

  if (currentError) {
    return NextResponse.json(currentError, { status: 500 });
  }

  const nextIsUsed = !current.is_used;
  const { error } = await supabase
    .from("coupons")
    .update({
      is_used: nextIsUsed,
      used_at: nextIsUsed ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(error, { status: 500 });
  }

  return NextResponse.redirect(new URL("/", request.url), 303);
}

