import type { SupabaseClient } from "@supabase/supabase-js";

export const COUPON_IMAGES_BUCKET = "coupon-images";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export function couponImagePath(
  householdId: string,
  couponId: string,
  ext: string,
) {
  const safeExt = ext.replace(/^\./, "").toLowerCase() || "jpg";
  return `${householdId}/${couponId}/image.${safeExt}`;
}

export function draftImagePath(householdId: string, draftId: string, ext: string) {
  const safeExt = ext.replace(/^\./, "").toLowerCase() || "jpg";
  return `${householdId}/drafts/${draftId}.${safeExt}`;
}

export function extensionFromMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export function extensionFromFilename(filename: string) {
  const m = filename.match(/\.([a-zA-Z0-9]+)$/);
  if (!m) return "jpg";
  const ext = m[1].toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
    return ext === "jpeg" ? "jpg" : ext;
  }
  return "jpg";
}

export async function uploadObject(
  supabase: SupabaseClient,
  path: string,
  body: ArrayBuffer,
  contentType: string,
) {
  const { error } = await supabase.storage.from(COUPON_IMAGES_BUCKET).upload(path, body, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function copyObject(
  supabase: SupabaseClient,
  fromPath: string,
  toPath: string,
) {
  const { error } = await supabase.storage.from(COUPON_IMAGES_BUCKET).copy(fromPath, toPath);
  if (error) throw error;
  return toPath;
}

export async function removeObject(supabase: SupabaseClient, path: string) {
  const { error } = await supabase.storage.from(COUPON_IMAGES_BUCKET).remove([path]);
  if (error) throw error;
}

export async function createSignedImageUrl(supabase: SupabaseClient, path: string) {
  const { data, error } = await supabase.storage
    .from(COUPON_IMAGES_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

/** Ensures storage path belongs to the given household (defense in depth). */
export function assertPathInHousehold(path: string, householdId: string) {
  const first = path.split("/")[0];
  if (first !== householdId) {
    throw new Error("Invalid image path for household");
  }
}
