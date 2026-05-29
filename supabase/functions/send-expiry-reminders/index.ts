// Supabase Edge Function (Deno)
// Sends reminder emails for coupons expiring soon using SMTP.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

type Env = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USERNAME: string;
  SMTP_PASSWORD: string;
  SMTP_FROM: string;
};

function required(env: Record<string, string | undefined>, key: string) {
  const v = env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toIsoDate(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

Deno.serve(async () => {
  const env = Deno.env.toObject();
  const SUPABASE_URL = required(env, "SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = required(env, "SUPABASE_SERVICE_ROLE_KEY");

  const SMTP_HOST = required(env, "SMTP_HOST");
  const SMTP_PORT = required(env, "SMTP_PORT");
  const SMTP_USERNAME = required(env, "SMTP_USERNAME");
  const SMTP_PASSWORD = required(env, "SMTP_PASSWORD");
  const SMTP_FROM = required(env, "SMTP_FROM");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Load households with notifications enabled
  const { data: settings, error: settingsError } = await supabase
    .from("notification_settings")
    .select("household_id, remind_days_before, email_notifications_enabled")
    .eq("email_notifications_enabled", true);

  if (settingsError) {
    return new Response(JSON.stringify(settingsError), { status: 500 });
  }

  const today = new Date();
  const results: Array<{ household_id: string; sent: number; target_date: string }> = [];

  const smtp = new SmtpClient();
  await smtp.connectTLS({
    hostname: SMTP_HOST,
    port: Number(SMTP_PORT),
    username: SMTP_USERNAME,
    password: SMTP_PASSWORD,
  });

  try {
    for (const s of settings ?? []) {
      const targetDate = toIsoDate(addDays(today, s.remind_days_before ?? 7));

      const { data: coupons, error: couponsError } = await supabase
        .from("coupons")
        .select("id, title, code, expiry_date")
        .eq("household_id", s.household_id)
        .eq("is_used", false)
        .eq("expiry_date", targetDate);

      if (couponsError) continue;
      if (!coupons || coupons.length === 0) continue;

      const { data: members, error: membersError } = await supabase
        .from("profiles")
        .select("email")
        .eq("household_id", s.household_id);

      if (membersError) continue;

      const toEmails = (members ?? [])
        .map((m) => (m.email ?? "").trim())
        .filter(Boolean);

      if (toEmails.length === 0) continue;

      const subject = `תזכורת: קופון פוקע בעוד ${s.remind_days_before} ימים`;
      const lines = coupons.map((c) => `- ${c.title}${c.code ? ` (קוד: ${c.code})` : ""}`);
      const body = [
        "שלום,",
        "",
        `יש לך קופונים שפוקעים בתאריך ${targetDate}:`,
        "",
        ...lines,
        "",
        "קופונים למשפחה",
      ].join("\\n");

      for (const to of toEmails) {
        await smtp.send({
          from: SMTP_FROM,
          to,
          subject,
          content: body,
        });
      }

      results.push({ household_id: s.household_id, sent: toEmails.length, target_date: targetDate });
    }
  } finally {
    await smtp.close();
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { "content-type": "application/json" },
  });
});

