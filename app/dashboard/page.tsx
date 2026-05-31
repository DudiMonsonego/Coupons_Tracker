import Link from "next/link";
import { CalendarClock, Sparkles, TicketPercent } from "lucide-react";

import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { attachCouponImageUrls } from "@/lib/coupons/attach-image-urls";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCouponStatus, isShownInActiveTab } from "@/lib/coupons/status";
import { formatMoneyILS } from "@/lib/coupons/money";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardClient } from "@/app/dashboard/dashboard-client";
import { SchemaMissingBanner } from "@/app/dashboard/schema-missing";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSessionProfile();
  const supabase = await createSupabaseServerClient();
  const expiringSoonDays = 7;

  const { data: rawCoupons, error } = await supabase
    .from("coupons")
    .select(
      "id, title, code, notes, tags, expiry_date, is_used, created_at, image_path, category, coupon_value, coupon_cost, brand_name, logo_url",
    )
    .eq("household_id", session.householdId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    if (error.code === "42703") {
      return (
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold tracking-tight">דשבורד</h1>
          <SchemaMissingBanner />
        </div>
      );
    }
    throw error;
  }

  const coupons = await attachCouponImageUrls(supabase, rawCoupons ?? []);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const activeCount = (coupons ?? []).filter((c) => {
    const s = getCouponStatus({
      isUsed: c.is_used,
      expiryDate: c.expiry_date,
      expiringSoonDays,
    });
    return s === "active" || s === "expiring";
  }).length;

  const expiringThisMonthCount = (coupons ?? []).filter((c) => {
    if (!c.expiry_date || c.is_used) return false;
    const d = new Date(c.expiry_date);
    return d >= monthStart && d <= monthEnd;
  }).length;

  const savingsThisMonth = (coupons ?? [])
    .filter((c) => {
      if (c.is_used || c.coupon_value == null) return false;
      const s = getCouponStatus({
        isUsed: c.is_used,
        expiryDate: c.expiry_date,
        expiringSoonDays,
      });
      if (!isShownInActiveTab(s)) return false;
      if (!c.expiry_date) return true;
      const d = new Date(c.expiry_date);
      return d >= monthStart && d <= monthEnd;
    })
    .reduce((sum, c) => sum + Number(c.coupon_value ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/10 bg-gradient-to-l from-violet-600 via-fuchsia-600 to-amber-500 p-6 text-white shadow-sm dark:border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm/6 opacity-95">
              <Sparkles className="h-4 w-4" />
              ניהול קופונים משפחתי
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              שלום {session.displayName ?? "!"}
            </h1>
            <p className="mt-2 text-sm/6 opacity-90">
              הוסיפו קופונים, סננו לפי תוקף, ועבדו יחד כמשפחה — או לבד.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/coupons">
              <Button
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                הוספת קופון
              </Button>
            </Link>
            <Link href="/settings/family">
              <Button
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                שיתוף משפחתי
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>שוברים פעילים</CardTitle>
            <CardDescription>סיכום מהיר</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3">
              <div className="text-3xl font-semibold">{activeCount}</div>
              <TicketPercent className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>פוקעים החודש</CardTitle>
            <CardDescription>בדיקה מיידית</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3">
              <div className="text-3xl font-semibold">{expiringThisMonthCount}</div>
              <CalendarClock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>חסכון החודש</CardTitle>
            <CardDescription>שווי קופונים פעילים שפוקעים החודש</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {savingsThisMonth > 0 ? formatMoneyILS(savingsThisMonth) : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <DashboardClient coupons={coupons ?? []} expiringSoonDays={expiringSoonDays} />
    </div>
  );
}

