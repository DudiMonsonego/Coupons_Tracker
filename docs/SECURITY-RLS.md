# Security: Family multi-tenancy (RLS)

## Terminology

| Audit term | Database |
|------------|----------|
| Family | `public.households` |
| Family ID | `households.id` / `coupons.household_id` |
| Member | `public.profiles` |
| Active family context | `profiles.household_id` |

There is no separate `family_id` column. **`coupons.household_id`** is the tenant key.

## Table relationships

```
households (1) ──< profiles (many)     profiles.household_id → active context
       │
       └──< coupons (many)            coupons.household_id → shared family data
       │
       └──< household_invites
       └──< notification_settings

profiles.family_household_id  — family joined via invite (login restores here)
profiles.solo_household_id    — optional private household when switching accounts
```

## RLS rule (coupons)

Any authenticated user whose `profiles.household_id` equals `coupons.household_id` may:

- **SELECT** all coupons in that household (not only rows they created)
- **INSERT** coupons with `household_id` = their active household
- **UPDATE** any coupon in that household
- **DELETE** any coupon in that household

Implemented via:

```sql
public.is_same_household(coupons.household_id)
-- equivalent to:
-- coupons.household_id = (select household_id from profiles where id = auth.uid())
```

## Storage (`coupon-images` bucket)

Object paths: `{household_id}/{coupon_id}/image.ext`

Policies compare the first folder to `profiles.household_id` for `auth.uid()`, so all family members can read/upload/delete images under their shared household prefix.

## Apply migrations

Run in Supabase SQL Editor (after `apply-all-schema.sql`):

`supabase/migrations/20260531100000_household_multi_tenant_rls.sql`

## Verify

```sql
-- As authenticated user (SQL editor: use RLS test or app)
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename = 'coupons';

select policyname, cmd, qual, with_check
from pg_policies where tablename = 'coupons';
```

## Service role

`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. The app uses it only for onboarding, invites, and household rename. Coupon CRUD in the app uses the **user session client** and is protected by RLS.

## Solo vs family

When a member switches to **solo** account, `profiles.household_id` points to `solo_household_id`. RLS then scopes them to solo coupons only—not the family list. Switching back restores family access.
