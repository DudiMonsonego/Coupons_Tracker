## send-expiry-reminders

Daily scheduled Edge Function that emails each household when coupons are about to expire.

### Required environment variables
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM`

### Scheduler
In Supabase Dashboard:
- **Edge Functions** → deploy `send-expiry-reminders`
- **Scheduled Triggers** → create a daily schedule calling this function.

