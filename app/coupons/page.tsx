import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SchemaMissingBanner } from "@/app/dashboard/schema-missing";
import { AddCouponForm } from "@/app/coupons/add-coupon-form";
import { getCategoryLabel } from "@/lib/coupons/categories";
import { formatMoneyILS } from "@/lib/coupons/money";

export const dynamic = "force-dynamic";

export default async function CouponsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const saved = sp.saved === "1";

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.household_id) {
    redirect("/onboarding/household");
  }

  const { data: coupons, error } = await supabase
    .from("coupons")
    .select(
      "id, title, code, notes, tags, expiry_date, is_used, created_at, category, coupon_value, coupon_cost, brand_name",
    )
    .eq("household_id", profile.household_id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error?.code === "42703") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">קופונים</h1>
        <SchemaMissingBanner />
      </div>
    );
  }

  if (error) {
    throw error;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">קופונים</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            הוספה מהירה ורשימה. נרחיב לגריד/רשימה, סינון ועריכה בשלב הבא.
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>הוספת קופון</CardTitle>
            <CardDescription>התחלה מהירה</CardDescription>
          </CardHeader>
          <CardContent>
            <AddCouponForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>רשימה</CardTitle>
            <CardDescription>50 אחרונים</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(coupons ?? []).length === 0 ? (
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  אין עדיין קופונים.
                </div>
              ) : (
                coupons!.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-950"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {c.title}
                        </div>
                        <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                          {c.brand_name ? `${c.brand_name} · ` : ""}
                          {getCategoryLabel(c.category) ? `${getCategoryLabel(c.category)} · ` : ""}
                          {c.code ? `קוד: ${c.code}` : "ללא קוד"}
                          {c.expiry_date ? ` · תוקף: ${c.expiry_date}` : ""}
                        </div>
                        {c.coupon_value != null || c.coupon_cost != null ? (
                          <div className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            {c.coupon_value != null ? `שווי: ${formatMoneyILS(c.coupon_value)}` : ""}
                            {c.coupon_value != null && c.coupon_cost != null ? " · " : ""}
                            {c.coupon_cost != null ? `עלות: ${formatMoneyILS(c.coupon_cost)}` : ""}
                          </div>
                        ) : null}
                        {c.notes ? (
                          <div className="mt-2 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                            {c.notes}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">
                        {c.is_used ? "שומש" : "פעיל"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

