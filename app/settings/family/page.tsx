import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canManageFamilyInvites } from "@/lib/auth/permissions";
import { InviteGenerator } from "./invite-generator";
import { InvitesList } from "./invites-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function FamilySettingsPage() {
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

  if (!canManageFamilyInvites({ role: profile.role })) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">שיתוף משפחתי</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              רק מנהל/ת המשפחה יכול/ה ליצור קודי הזמנה ולשתף אותם עם בני המשפחה.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">חזרה</Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>אין הרשאה</CardTitle>
            <CardDescription>
              הצטרפת/ת למשפחה באמצעות קוד — אין אפשרות ליצור קודים חדשים. פנה/י
              למנהל/ת המשפחה לקבלת הזמנה.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">שיתוף משפחתי</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            צרו קוד הזמנה ושלחו אותו לבני המשפחה כדי שיצטרפו למשק הבית.
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">חזרה</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>יצירת הזמנה</CardTitle>
            <CardDescription>קוד חד-פעמי לשיתוף — מנהל/ת המשפחה בלבד</CardDescription>
          </CardHeader>
          <CardContent>
            <InviteGenerator />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ניהול הזמנות</CardTitle>
            <CardDescription>צפייה וביטול</CardDescription>
          </CardHeader>
          <CardContent>
            <InvitesList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
