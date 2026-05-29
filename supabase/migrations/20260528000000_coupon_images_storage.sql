-- Private bucket for coupon images. Object paths MUST start with household UUID:
--   {household_id}/{coupon_id}/image.{ext}
--   {household_id}/drafts/{draft_id}.{ext}

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

-- Helper: current user's household_id as text (matches first path segment)
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

-- SELECT: only objects inside your household folder
drop policy if exists "coupon_images_select_household" on storage.objects;
create policy "coupon_images_select_household"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'coupon-images'
  and (storage.foldername(name))[1] = public.storage_household_id()
);

-- INSERT: only into your household folder
drop policy if exists "coupon_images_insert_household" on storage.objects;
create policy "coupon_images_insert_household"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'coupon-images'
  and (storage.foldername(name))[1] = public.storage_household_id()
);

-- UPDATE: only within your household folder
drop policy if exists "coupon_images_update_household" on storage.objects;
create policy "coupon_images_update_household"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'coupon-images'
  and (storage.foldername(name))[1] = public.storage_household_id()
)
with check (
  bucket_id = 'coupon-images'
  and (storage.foldername(name))[1] = public.storage_household_id()
);

-- DELETE: only within your household folder
drop policy if exists "coupon_images_delete_household" on storage.objects;
create policy "coupon_images_delete_household"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'coupon-images'
  and (storage.foldername(name))[1] = public.storage_household_id()
);
