import type { SupabaseClient } from "@supabase/supabase-js";

import {
  assertPathInHousehold,
  copyObject,
  couponImagePath,
  extensionFromFilename,
  extensionFromMime,
  removeObject,
  uploadObject,
} from "@/lib/storage/coupon-images";

export async function finalizeCouponImage(
  supabase: SupabaseClient,
  householdId: string,
  couponId: string,
  options: {
    draftImagePath?: string;
    imageFile?: File;
  },
): Promise<string | null> {
  const { draftImagePath, imageFile } = options;

  if (draftImagePath) {
    assertPathInHousehold(draftImagePath, householdId);
    const ext = draftImagePath.split(".").pop() ?? "jpg";
    const finalPath = couponImagePath(householdId, couponId, ext);
    await copyObject(supabase, draftImagePath, finalPath);
    await removeObject(supabase, draftImagePath).catch(() => {});
    return finalPath;
  }

  if (imageFile && imageFile.size > 0) {
    const ext = extensionFromFilename(imageFile.name);
    const finalPath = couponImagePath(householdId, couponId, ext);
    const bytes = await imageFile.arrayBuffer();
    const mime = imageFile.type || "image/jpeg";
    await uploadObject(supabase, finalPath, bytes, mime);
    return finalPath;
  }

  return null;
}

export async function deleteCouponImageIfPresent(
  supabase: SupabaseClient,
  householdId: string,
  imagePath: string | null | undefined,
) {
  if (!imagePath) return;
  assertPathInHousehold(imagePath, householdId);
  await removeObject(supabase, imagePath).catch(() => {});
}
