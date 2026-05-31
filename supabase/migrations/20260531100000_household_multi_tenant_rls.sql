-- =============================================================================
-- Multi-tenant RLS: Family = household
-- =============================================================================
-- Data model (audit mapping):
--   "Family"     -> public.households (id)
--   "Member"     -> public.profiles (household_id = active family/solo context)
--   "Coupon"     -> public.coupons (household_id scopes rows to one family)
--
-- All members with the same profiles.household_id see the same coupons.
-- Solo mode: user switches household_id to solo_household_id (private coupons).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER, stable) — used inside RLS policies
-- -----------------------------------------------------------------------------

create or replace function public.auth_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid()
$$;

create or replace function public.auth_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.household_id
  from public.profiles p
  where p.id = auth.uid()
$$;

-- True when target household matches the signed-in user's active household
create or replace function public.is_same_household(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_household_id is not null
    and target_household_id = public.auth_household_id()
$$;

create or replace function public.is_household_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'owner'
      and p.household_id = public.auth_household_id()
  )
$$;

-- Storage policies use first path segment = household uuid
create or replace function public.storage_household_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_household_id()::text
$$;

grant execute on function public.auth_user_id() to authenticated;
grant execute on function public.auth_household_id() to authenticated;
grant execute on function public.is_same_household(uuid) to authenticated;
grant execute on function public.is_household_owner() to authenticated;
grant execute on function public.storage_household_id() to authenticated;

-- -----------------------------------------------------------------------------
-- coupons: family members share read / write / delete
-- -----------------------------------------------------------------------------

alter table public.coupons enable row level security;

drop policy if exists "coupons_select_household_members" on public.coupons;
create policy "coupons_select_household_members"
on public.coupons
for select
to authenticated
using (public.is_same_household(household_id));

drop policy if exists "coupons_insert_household_members" on public.coupons;
create policy "coupons_insert_household_members"
on public.coupons
for insert
to authenticated
with check (
  household_id = public.auth_household_id()
);

drop policy if exists "coupons_update_household_members" on public.coupons;
create policy "coupons_update_household_members"
on public.coupons
for update
to authenticated
using (public.is_same_household(household_id))
with check (public.is_same_household(household_id));

drop policy if exists "coupons_delete_household_members" on public.coupons;
create policy "coupons_delete_household_members"
on public.coupons
for delete
to authenticated
using (public.is_same_household(household_id));

create index if not exists coupons_household_id_idx on public.coupons (household_id);

-- -----------------------------------------------------------------------------
-- profiles: own row + read other members in same household
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_household" on public.profiles;
create policy "profiles_select_own_or_household"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_same_household(household_id)
);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

-- -----------------------------------------------------------------------------
-- households: read/update own active household
-- -----------------------------------------------------------------------------

alter table public.households enable row level security;

drop policy if exists "households_select_member" on public.households;
create policy "households_select_member"
on public.households
for select
to authenticated
using (id = public.auth_household_id());

drop policy if exists "households_update_owner" on public.households;
create policy "households_update_owner"
on public.households
for update
to authenticated
using (id = public.auth_household_id() and public.is_household_owner())
with check (id = public.auth_household_id() and public.is_household_owner());

drop policy if exists "households_insert_authenticated" on public.households;
create policy "households_insert_authenticated"
on public.households
for insert
to authenticated
with check (true);

-- -----------------------------------------------------------------------------
-- notification_settings: per household
-- -----------------------------------------------------------------------------

alter table public.notification_settings enable row level security;

drop policy if exists "notification_settings_select_household" on public.notification_settings;
create policy "notification_settings_select_household"
on public.notification_settings
for select
to authenticated
using (public.is_same_household(household_id));

drop policy if exists "notification_settings_insert_household" on public.notification_settings;
create policy "notification_settings_insert_household"
on public.notification_settings
for insert
to authenticated
with check (public.is_same_household(household_id));

drop policy if exists "notification_settings_update_household" on public.notification_settings;
create policy "notification_settings_update_household"
on public.notification_settings
for update
to authenticated
using (public.is_same_household(household_id))
with check (public.is_same_household(household_id));

-- -----------------------------------------------------------------------------
-- household_invites: members read; only owner creates/updates
-- -----------------------------------------------------------------------------

alter table public.household_invites enable row level security;

drop policy if exists "invites_select_household" on public.household_invites;
create policy "invites_select_household"
on public.household_invites
for select
to authenticated
using (public.is_same_household(household_id));

drop policy if exists "invites_insert_owner" on public.household_invites;
create policy "invites_insert_owner"
on public.household_invites
for insert
to authenticated
with check (
  public.is_same_household(household_id)
  and public.is_household_owner()
);

drop policy if exists "invites_update_owner" on public.household_invites;
create policy "invites_update_owner"
on public.household_invites
for update
to authenticated
using (public.is_same_household(household_id) and public.is_household_owner())
with check (public.is_same_household(household_id) and public.is_household_owner());

-- -----------------------------------------------------------------------------
-- storage.objects: coupon-images bucket (household folder = first path segment)
-- -----------------------------------------------------------------------------

drop policy if exists "coupon_images_select_household" on storage.objects;
create policy "coupon_images_select_household"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'coupon-images'
  and (storage.foldername(name))[1] = public.storage_household_id()
);

drop policy if exists "coupon_images_insert_household" on storage.objects;
create policy "coupon_images_insert_household"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'coupon-images'
  and (storage.foldername(name))[1] = public.storage_household_id()
);

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

drop policy if exists "coupon_images_delete_household" on storage.objects;
create policy "coupon_images_delete_household"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'coupon-images'
  and (storage.foldername(name))[1] = public.storage_household_id()
);
