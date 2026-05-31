import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const error = typeof sp.error === "string" ? sp.error : null;
  const redirectUrl = typeof sp.redirect === "string" ? sp.redirect : null;
  const message = typeof sp.message === "string" ? sp.message : null;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">התחברות</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          התחבר/י עם Google כדי להמשיך. לאחר ההתחברות תוכל/י ליצור משק בית חדש או
          להצטרף למשק בית קיים עם קוד הזמנה.
        </p>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-200">
            {error === "callback" && message
              ? `שגיאת התחברות: ${message}`
              : "שגיאת התחברות. ודא/י ש-Supabase Site URL ו-Redirect URLs מוגדרים לכתובת האתר הזו."}
            {redirectUrl ? (
              <p className="mt-2 break-all text-xs">
                Redirect נדרש: <code>{redirectUrl}</code>
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6">
          <GoogleSignInButton />
        </div>
      </div>
    </div>
  );
}
