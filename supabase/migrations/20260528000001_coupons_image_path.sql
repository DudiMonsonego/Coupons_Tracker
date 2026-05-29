alter table public.coupons
add column if not exists image_path text;

comment on column public.coupons.image_path is
  'Storage object path in coupon-images bucket: {household_id}/{coupon_id}/image.{ext}';
