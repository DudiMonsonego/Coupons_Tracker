import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HouseholdSettingsPage({
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
    .select("household_id, role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!profile?.household_id) {
    redirect("/onboarding/household");
  }

  // Fetch household via admin client so the UI doesn't get blocked by RLS misconfig.
  const admin = createSupabaseAdminClient();
  const { data: household } = await admin
    .from("households")
    .select("id, name")
    .eq("id", profile.household_id)
    .maybeSingle();

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-black">
      <main className="w-full max-w-xl rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">ניהול משק בית</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              עדכון שם המשק בית. נדרש משתמש בעלים.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">חזרה</Button>
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {saved ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
              נשמר בהצלחה
            </div>
          ) : null}

          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            מזהה משק בית: {household?.id ?? profile.household_id}
          </div>

          <form
            action="/settings/household/update"
            method="post"
            className="space-y-4"
          >
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
              disabled={profile.role !== "owner"}
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
              רק בעל המשק בית יכול לעדכן את השם.
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

