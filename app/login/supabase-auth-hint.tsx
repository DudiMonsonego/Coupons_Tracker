"use client";

import { useEffect, useState } from "react";

export function SupabaseAuthHint() {
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    setCallbackUrl(`${window.location.origin}/auth/callback`);
  }, []);

  if (!callbackUrl || callbackUrl.includes("localhost")) {
    return null;
  }

  return (
    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-50 p-3 text-xs text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
      <p className="font-semibold">אם ההתחברות מפנה ל-localhost</p>
      <p className="mt-1">ב-Supabase → Authentication → URL configuration:</p>
      <ol className="mt-2 list-decimal space-y-1 ps-4">
        <li>
          <span className="font-medium">Site URL</span> ={" "}
          <code className="break-all rounded bg-black/10 px-1">{window.location.origin}</code>
        </li>
        <li>
          הוסף ל-<span className="font-medium">Redirect URLs</span>:{" "}
          <code className="break-all rounded bg-black/10 px-1">{callbackUrl}</code>
        </li>
      </ol>
    </div>
  );
}
