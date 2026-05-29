import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import {
  parseCouponFromImage,
  parseCouponFromText,
} from "@/lib/ai/parse-coupon";
import {
  draftImagePath as buildDraftImagePath,
  extensionFromFilename,
  extensionFromMime,
  uploadObject,
} from "@/lib/storage/coupon-images";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.household_id) {
    return NextResponse.json({ ok: false, message: "No household" }, { status: 400 });
  }

  const formData = await request.formData();
  const text = String(formData.get("text") ?? "").trim();
  const image = formData.get("image");

  let draftImagePath: string | null = null;
  let previewUrl: string | null = null;

  try {
    if (image instanceof File && image.size > 0) {
      if (image.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { ok: false, message: "התמונה גדולה מדי (מקסימום 5MB)" },
          { status: 400 },
        );
      }

      const bytes = await image.arrayBuffer();
      const mime = image.type || "image/jpeg";
      const ext = image.name
        ? extensionFromFilename(image.name)
        : extensionFromMime(mime);
      const draftId = randomUUID();
      draftImagePath = buildDraftImagePath(profile.household_id, draftId, ext);
      await uploadObject(supabase, draftImagePath, bytes, mime);

      const { data: signed } = await supabase.storage
        .from("coupon-images")
        .createSignedUrl(draftImagePath, 60 * 30);
      previewUrl = signed?.signedUrl ?? null;

      const parsed = process.env.OPENAI_API_KEY
        ? await parseCouponFromImage(bytes, mime)
        : parseCouponFromText(text || "קופון מתמונה");

      if (!process.env.OPENAI_API_KEY && !text) {
        parsed.notes =
          (parsed.notes ? `${parsed.notes}\n\n` : "") +
          "הוסף OPENAI_API_KEY לניתוח תמונה אוטומטי, או הדבק טקסט מהקופון.";
      }

      return NextResponse.json({
        ok: true,
        parsed,
        draftImagePath,
        previewUrl,
      });
    }

    if (!text) {
      return NextResponse.json(
        { ok: false, message: "העלה תמונה או הדבק טקסט" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      parsed: parseCouponFromText(text),
      draftImagePath: null,
      previewUrl: null,
    });
  } catch (err) {
    if (draftImagePath) {
      await supabase.storage.from("coupon-images").remove([draftImagePath]).catch(() => {});
    }
    const message = err instanceof Error ? err.message : "שגיאה בניתוח";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
