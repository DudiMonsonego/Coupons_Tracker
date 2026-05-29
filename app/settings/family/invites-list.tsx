"use client";

import { useEffect, useState, useTransition } from "react";
import { Ban } from "lucide-react";

import { listInvitesAction, revokeInviteAction, type InviteRow } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("he-IL");
}

function statusLabel(status: InviteRow["status"]) {
  switch (status) {
    case "pending":
      return { text: "ממתין", variant: "warning" as const };
    case "accepted":
      return { text: "אושר", variant: "success" as const };
    case "revoked":
      return { text: "בוטל", variant: "muted" as const };
    case "expired":
      return { text: "פג תוקף", variant: "muted" as const };
  }
}

export function InvitesList() {
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    setError(null);
    const res = await listInvitesAction();
    if (!res.ok) {
      setError(res.message);
      setInvites([]);
      setLoading(false);
      return;
    }
    setInvites(res.invites);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          הזמנות אחרונות
        </div>
        <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
          רענון
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-zinc-600 dark:text-zinc-400">טוען…</div>
      ) : invites.length === 0 ? (
        <div className="text-sm text-zinc-600 dark:text-zinc-400">אין הזמנות.</div>
      ) : (
        <div className="space-y-2">
          {invites.map((i) => {
            const s = statusLabel(i.status);
            return (
              <div
                key={i.id}
                className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                      {i.id}
                    </div>
                    <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      נוצר: {formatDate(i.created_at)} · תוקף: {formatDate(i.expires_at)}
                      {i.accepted_at ? ` · אושר: ${formatDate(i.accepted_at)}` : ""}
                    </div>
                  </div>
                  <Badge variant={s.variant}>{s.text}</Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending || i.status !== "pending"}
                    onClick={() => {
                      if (!confirm("לבטל את ההזמנה?")) return;
                      startTransition(async () => {
                        const res = await revokeInviteAction(i.id);
                        if (!res.ok) setError(res.message);
                        await load();
                      });
                    }}
                  >
                    <Ban className="h-4 w-4" />
                    ביטול
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

