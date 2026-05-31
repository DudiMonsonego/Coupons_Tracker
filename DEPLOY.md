# Deploying to Vercel

## 1. Root directory

If the repo root is `Coupons_Tracker`, set **Root Directory** to `coupons-tracker` in Vercel project settings.

## 2. Environment variables (required)

Add these in **Vercel → Project → Settings → Environment Variables** for **Production**, **Preview**, and **Development**:

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes |
| `NEXT_PUBLIC_SITE_URL` | Yes (e.g. `https://your-app.vercel.app`) |
| `OPENAI_API_KEY` | Optional (image OCR) |

Use the same values as your local `.env`. `NEXT_PUBLIC_*` variables must be set **before** deploy so the build can embed them.

## 3. Supabase auth (fixes Google login redirect)

In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **URL configuration**:

1. **Site URL** — set to your live site, e.g. `https://your-app.vercel.app` (not localhost)
2. **Redirect URLs** — add these (one per line):
   - `https://your-app.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)
3. Click **Save**

If login still fails, check **Authentication → Providers → Google** is enabled.

## 4. Google Cloud Console (usually already done)

In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your OAuth client:

**Authorized redirect URIs** must include Supabase’s callback (not your Vercel URL):

`https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

## 5. Redeploy on Vercel

After changing env vars or pushing code: **Deployments → … → Redeploy**.

## 6. Database

Run `supabase/apply-all-schema.sql` in the Supabase SQL Editor if you have not already.
