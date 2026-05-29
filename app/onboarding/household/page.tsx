import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/app/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function CreateFirstHouseholdPage() {
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

  if (profile?.household_id) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            {auth.user.email ?? ""}
          </div>
          <SignOutButton />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          הגדרת משק בית
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          אפשר ליצור משק בית חדש או להצטרף למשק בית קיים באמצעות קוד הזמנה.
        </p>

        <div className="mt-6 space-y-6">
          <form action="/onboarding/household/solo" method="post" className="space-y-3">
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-black/[0.04] dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-white/[0.06]"
            >
              המשך כמשתמש יחיד
            </button>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              ניתן לשתף עם משפחה מאוחר יותר דרך יצירת קוד הזמנה.
            </p>
          </form>

          <div className="h-px w-full bg-black/10 dark:bg-white/10" />

          <form action="/onboarding/household/create" method="post" className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              יצירת משק בית חדש
            </h2>
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
                placeholder="למשל: משפחת כהן"
                required
                className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/10"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              יצירה והמשך
            </button>
          </form>

          <div className="h-px w-full bg-black/10 dark:bg-white/10" />

          <form action="/onboarding/household/join" method="post" className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              הצטרפות למשק בית קיים
            </h2>
            <div className="space-y-2">
              <label
                htmlFor="code"
                className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                קוד הזמנה
              </label>
              <input
                id="code"
                name="code"
                placeholder="הדבק/י קוד"
                required
                className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-950 dark:focus:ring-white/10"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-black/[0.04] dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-white/[0.06]"
            >
              הצטרפות
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

