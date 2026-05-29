import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function NotificationSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const saved = sp.saved === "1";

  const session = await getSessionProfile();
  if (session.role !== "owner") {
    redirect("/dashboard");
  }

  const admin = createSupabaseAdminClient();
  const { data: settings } = await admin
    .from("notification_settings")
    .select("household_id, remind_days_before, email_notifications_enabled")
    .eq("household_id", session.householdId)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">התראות במייל</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            קבעו כמה ימים לפני התוקף לשלוח תזכורת לכל בני הבית.
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">חזרה</Button>
        </Link>
      </div>

      {saved ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
          נשמר בהצלחה
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>הגדרות</CardTitle>
          <CardDescription>ברירת מחדל: 7 ימים לפני</CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/settings/notifications/update" method="post" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="remind_days_before" className="block text-sm font-medium">
                ימים לפני תוקף
              </label>
              <Input
                id="remind_days_before"
                name="remind_days_before"
                type="number"
                min={1}
                max={60}
                defaultValue={settings?.remind_days_before ?? 7}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-3 py-3 text-sm dark:border-white/10 dark:bg-zinc-950">
              <div className="font-medium">התראות במייל</div>
              <input
                name="email_notifications_enabled"
                type="checkbox"
                defaultChecked={settings?.email_notifications_enabled ?? true}
                className="h-5 w-5 accent-black dark:accent-white"
              />
            </div>

            <Button type="submit" className="w-full">
              שמירה
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

