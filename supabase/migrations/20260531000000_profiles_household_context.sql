-- Track family membership vs personal solo household for account switching
alter table public.profiles
add column if not exists family_household_id uuid references public.households(id),
add column if not exists solo_household_id uuid references public.households(id);

comment on column public.profiles.family_household_id is
  'Shared family the user joined via invite; login always returns here';
comment on column public.profiles.solo_household_id is
  'Optional personal household for private coupons';

-- Backfill for members who joined before this migration
update public.profiles
set family_household_id = household_id
where role = 'member'
  and family_household_id is null
  and household_id is not null;
