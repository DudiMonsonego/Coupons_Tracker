import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canSwitchAccounts, isOnFamilyAccount, isOnSoloAccount } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HouseholdSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const saved = sp.saved === "1";
  const switched = typeof sp.switched === "string" ? sp.switched : null;

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, family_household_id, solo_household_id, role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.household_id) {
    redirect("/onboarding/household");
  }

  const admin = createSupabaseAdminClient();
  const { data: household } = await admin
    .from("households")
    .select("id, name")
    .eq("id", profile.household_id)
    .maybeSingle();

  let familyName: string | null = null;
  if (profile.family_household_id) {
    const { data: family } = await admin
      .from("households")
      .select("name")
      .eq("id", profile.family_household_id)
      .maybeSingle();
    familyName = family?.name ?? null;
  }

  const sessionLike = {
    householdId: profile.household_id,
    familyHouseholdId: profile.family_household_id ?? null,
    soloHouseholdId: profile.solo_household_id ?? null,
  };

  const onFamily = isOnFamilyAccount(sessionLike);
  const onSolo = isOnSoloAccount(sessionLike);
  const canSwitch = canSwitchAccounts(sessionLike);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-black">
      <main className="w-full max-w-xl space-y-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">ניהול משק בית</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {canSwitch
                ? "ניתן לעבור בין משפחה לחשבון אישי. בכל התחברות מחדש תיכנס/י למשפחה."
                : "עדכון שם המשק בית."}
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">חזרה</Button>
          </Link>
        </div>

        {canSwitch ? (
          <div className="rounded-2xl border border-violet-500/20 bg-violet-50 p-4 dark:border-violet-500/30 dark:bg-violet-950/30">
            <div className="text-sm font-semibold text-violet-900 dark:text-violet-100">
              חשבון פעיל: {onFamily ? "משפחה" : onSolo ? "אישי" : "—"}
            </div>
            {onFamily && familyName ? (
              <p className="mt-1 text-xs text-violet-800 dark:text-violet-200">{familyName}</p>
            ) : null}
            {onSolo ? (
              <p className="mt-1 text-xs text-violet-800 dark:text-violet-200">
                קופונים פרטיים — לא משותפים עם המשפחה
              </p>
            ) : null}
            {switched === "solo" ? (
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                עברת לחשבון האישי
              </p>
            ) : null}
            {switched === "family" ? (
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                חזרת לחשבון המשפחה
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {onSolo ? (
                <form action="/settings/household/switch-family" method="post" className="flex-1">
                  <Button type="submit" variant="secondary" className="w-full">
                    חזרה למשפחה
                  </Button>
                </form>
              ) : (
                <form action="/settings/household/switch-solo" method="post" className="flex-1">
                  <Button type="submit" variant="secondary" className="w-full">
                    מעבר לחשבון אישי
                  </Button>
                </form>
              )}
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          {saved ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
              נשמר בהצלחה
            </div>
          ) : null}

          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            מזהה משק בית: {household?.id ?? profile.household_id}
          </div>

          <form action="/settings/household/update" method="post" className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                שם המשק בית
              </label>
              <input
                id="name"
                name="name"
                defaultValue={household?.name ?? ""}
                placeholder="למשל: משפחת כהן"
                required
                className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/10"
              />
            </div>

            <button
              type="submit"
              disabled={profile.role !== "owner" || onSolo}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/90 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              שמירה
            </button>
          </form>

          <Link href="/settings/notifications">
            <Button variant="outline" className="w-full">
              התראות במייל
            </Button>
          </Link>

          {profile.role !== "owner" ? (
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              רק מנהל/ת המשפחה יכול/ה לשנות את שם המשפחה.
            </div>
          ) : onSolo ? (
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              שינוי שם זמין רק בחשבון המשפחה.
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
