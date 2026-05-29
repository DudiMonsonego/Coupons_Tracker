import type { SupabaseClient } from "@supabase/supabase-js";

import { createSignedImageUrl } from "@/lib/storage/coupon-images";

export async function attachCouponImageUrls<
  T extends { image_path?: string | null },
>(supabase: SupabaseClient, coupons: T[]) {
  return Promise.all(
    coupons.map(async (c) => {
      if (!c.image_path) {
        return { ...c, image_url: null as string | null };
      }
      try {
        const image_url = await createSignedImageUrl(supabase, c.image_path);
        return { ...c, image_url };
      } catch {
        return { ...c, image_url: null as string | null };
      }
    }),
  );
}
