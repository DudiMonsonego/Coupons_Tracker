"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  async function signInWithGoogle() {
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
  }

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
    >
      התחברות עם Google
    </button>
  );
}

