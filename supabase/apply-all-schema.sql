-- Run this entire file once in Supabase: SQL Editor → New query → Paste → Run
-- Fixes: column coupons.coupon_value does not exist (and related columns)

-- 1) Coupon columns
alter table public.coupons
add column if not exists image_path text,
add column if not exists category text,
add column if not exists coupon_value numeric(10, 2),
add column if not exists coupon_cost numeric(10, 2),
add column if not exists brand_name text,
add column if not exists logo_url text;

-- 1b) Profile household context (family vs solo switching)
alter table public.profiles
add column if not exists family_household_id uuid references public.households(id),
add column if not exists solo_household_id uuid references public.households(id);

-- 2) Private image storage bucket + household isolation
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'coupon-images',
  'coupon-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.storage_household_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.household_id::text
  from public.profiles p
  where p.id = auth.uid()
$$;

drop policy if exists "coupon_images_select_household" on storage.objects;
create policy "coupon_images_select_household"
on storage.objects for select to authenticated
using (
  bucket_id = 'coupon-images'
  and (storage.foldername(name))[1] = public.storage_household_id()
);

drop policy if exists "coupon_images_insert_household" on storage.objects;
create policy "coupon_images_insert_household"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'coupon-images'
  and (storage.foldername(name))[1] = public.storage_household_id()
);

drop policy if exists "coupon_images_update_household" on storage.objects;
create policy "coupon_images_update_household"
on storage.objects for update to authenticated
using (
  bucket_id = 'coupon-images'
  and (storage.foldername(name))[1] = public.storage_household_id()
)
with check (
  bucket_id = 'coupon-images'
  and (storage.foldername(name))[1] = public.storage_household_id()
);

drop policy if exists "coupon_images_delete_household" on storage.objects;
create policy "coupon_images_delete_household"
on storage.objects for delete to authenticated
using (
  bucket_id = 'coupon-images'
  and (storage.foldername(name))[1] = public.storage_household_id()
);
