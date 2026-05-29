"use client";

import { useActionState, useEffect, useRef } from "react";
import { createInviteAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type State =
  | { ok: false; message?: string }
  | { ok: true; code: string; expiresAt: string };

const initialState: State = { ok: false };

export function InviteGenerator() {
  const [state, action, pending] = useActionState(
    async () => createInviteAction(),
    initialState,
  );

  const codeRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (state.ok) {
      codeRef.current?.select();
    }
  }, [state.ok]);

  async function copy() {
    if (!state.ok) return;
    await navigator.clipboard.writeText(state.code);
  }

  return (
    <div className="space-y-4">
      <form action={action}>
        <Button type="submit" disabled={pending} className="w-full">
          יצירת קוד הזמנה
        </Button>
      </form>

      {!state.ok && state.message ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
          {state.message}
        </div>
      ) : null}

      {state.ok ? (
        <div className="space-y-2 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            קוד לשיתוף
          </div>
          <div className="flex gap-2">
            <Input
              ref={codeRef}
              readOnly
              value={state.code}
            />
            <Button
              type="button"
              onClick={copy}
              variant="outline"
            >
              העתקה
            </Button>
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            תוקף עד: {new Date(state.expiresAt).toLocaleString("he-IL")}
          </div>
        </div>
      ) : null}
    </div>
  );
}

