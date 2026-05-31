"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, CheckCircle2, Circle, LayoutGrid, List, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/coupons/brand-logo";
import { CategorySelect } from "@/components/coupons/category-select";
import { MoneyFields } from "@/components/coupons/money-fields";
import { getCategoryLabel } from "@/lib/coupons/categories";
import { formatMoneyILS } from "@/lib/coupons/money";
import { getCouponStatus, isShownInActiveTab } from "@/lib/coupons/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type DashboardCoupon = {
  id: string;
  title: string;
  code: string | null;
  notes: string | null;
  tags: string[] | null;
  expiry_date: string | null;
  is_used: boolean;
  created_at: string;
  image_url?: string | null;
  category: string | null;
  coupon_value: number | null;
  coupon_cost: number | null;
  brand_name: string | null;
  logo_url: string | null;
};

type Props = {
  coupons: DashboardCoupon[];
  expiringSoonDays: number;
};

type Tab = "active" | "expiring" | "used" | "archived";
type View = "grid" | "list";

function formatExpiry(date: string | null) {
  if (!date) return "ללא תוקף";
  return new Date(date).toLocaleDateString("he-IL");
}

export function DashboardClient({ coupons, expiringSoonDays }: Props) {
  const [tab, setTab] = useState<Tab>("active");
  const [view, setView] = useState<View>("grid");
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem("ct:view");
      if (v === "grid" || v === "list") setView(v);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("ct:view", view);
    } catch {}
  }, [view]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return coupons
      .map((c) => ({
        ...c,
        status: getCouponStatus({
          isUsed: c.is_used,
          expiryDate: c.expiry_date,
          expiringSoonDays,
        }),
      }))
      .filter((c) => (tab === "active" ? isShownInActiveTab(c.status) : c.status === tab))
      .filter((c) => {
        if (!qq) return true;
        const tags = (c.tags ?? []).join(" ").toLowerCase();
        return (
          c.title.toLowerCase().includes(qq) ||
          (c.code ?? "").toLowerCase().includes(qq) ||
          (c.notes ?? "").toLowerCase().includes(qq) ||
          tags.includes(qq)
        );
      });
  }, [coupons, expiringSoonDays, q, tab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש לפי שם, קוד, הערות או תגיות..."
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={view === "grid" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
            קוביות
          </Button>
          <Button
            type="button"
            variant={view === "list" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
            רשימה
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={tab === "active" ? "secondary" : "outline"}
          onClick={() => setTab("active")}
        >
          פעיל
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "expiring" ? "secondary" : "outline"}
          onClick={() => setTab("expiring")}
        >
          פוקע בקרוב
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "used" ? "secondary" : "outline"}
          onClick={() => setTab("used")}
        >
          שומש
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "archived" ? "secondary" : "outline"}
          onClick={() => setTab("archived")}
        >
          ארכיון
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
          אין קופונים בתצוגה הזו.
        </div>
      ) : (
        <div
          className={cn(
            view === "grid" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3",
          )}
        >
          {filtered.map((c) => (
            <div
              key={c.id}
              className={cn(
                "rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950",
                c.status === "expiring" && "border-amber-500/30",
                c.status === "archived" && "opacity-80",
              )}
            >
              {c.image_url ? (
                <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                  <Image
                    src={c.image_url}
                    alt={c.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : null}

              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <BrandLogo brandName={c.brand_name} logoUrl={c.logo_url} size={36} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {c.title}
                    </div>
                    <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      {c.code ? `קוד: ${c.code}` : "ללא קוד"} · {formatExpiry(c.expiry_date)}
                    </div>
                    {c.coupon_value != null || c.coupon_cost != null ? (
                      <div className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        {c.coupon_value != null ? `שווי: ${formatMoneyILS(c.coupon_value)}` : ""}
                        {c.coupon_value != null && c.coupon_cost != null ? " · " : ""}
                        {c.coupon_cost != null ? `עלות: ${formatMoneyILS(c.coupon_cost)}` : ""}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {getCategoryLabel(c.category) ? (
                    <Badge variant="muted">{getCategoryLabel(c.category)}</Badge>
                  ) : null}
                  {c.status === "active" ? <Badge variant="success">פעיל</Badge> : null}
                  {c.status === "expiring" ? <Badge variant="warning">פוקע בקרוב</Badge> : null}
                  {c.status === "used" ? <Badge variant="muted">שומש</Badge> : null}
                  {c.status === "archived" ? <Badge variant="muted">ארכיון</Badge> : null}
                </div>
              </div>

              {(c.tags ?? []).length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(c.tags ?? []).slice(0, 6).map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              ) : null}

              {c.notes ? (
                <div className="mt-3 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                  {c.notes}
                </div>
              ) : null}

              <div className="mt-4 flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                <form action="/coupons/toggle-used" method="post">
                  <input type="hidden" name="id" value={c.id} />
                  <Button size="sm" variant="outline" type="submit">
                    {c.is_used ? (
                      <>
                        <Circle className="h-4 w-4" />
                        סמן כלא שומש
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        סמן כמשומש
                      </>
                    )}
                  </Button>
                </form>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(editingId === c.id ? null : c.id)}
                >
                  <Pencil className="h-4 w-4" />
                  עריכה
                </Button>

                <form
                  action="/coupons/delete"
                  method="post"
                  onSubmit={(e) => {
                    if (!confirm("למחוק את הקופון?")) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={c.id} />
                  <Button size="sm" variant="destructive" type="submit">
                    <Trash2 className="h-4 w-4" />
                    מחיקה
                  </Button>
                </form>
                </div>

                {editingId === c.id ? (
                  <div className="w-full rounded-2xl border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-black">
                    <form action="/coupons/update" method="post" className="space-y-3">
                      <input type="hidden" name="id" value={c.id} />
                      <div className="space-y-2">
                        <label className="block text-sm font-medium" htmlFor={`t-${c.id}`}>
                          שם
                        </label>
                        <Input id={`t-${c.id}`} name="title" defaultValue={c.title} required />
                      </div>
                      <MoneyFields
                        idPrefix={`${c.id}-`}
                        valueDefault={c.coupon_value != null ? String(c.coupon_value) : ""}
                        costDefault={c.coupon_cost != null ? String(c.coupon_cost) : ""}
                      />
                      <div className="space-y-2">
                        <label className="block text-sm font-medium" htmlFor={`brand-${c.id}`}>
                          מותג
                        </label>
                        <Input
                          id={`brand-${c.id}`}
                          name="brand_name"
                          defaultValue={c.brand_name ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium" htmlFor={`c-${c.id}`}>
                          קוד
                        </label>
                        <Input id={`c-${c.id}`} name="code" defaultValue={c.code ?? ""} />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium" htmlFor={`e-${c.id}`}>
                          תוקף
                        </label>
                        <Input
                          id={`e-${c.id}`}
                          name="expiry_date"
                          type="date"
                          defaultValue={c.expiry_date ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium" htmlFor={`cat-${c.id}`}>
                          קטגוריה
                        </label>
                        <CategorySelect
                          id={`cat-${c.id}`}
                          defaultValue={c.category ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium" htmlFor={`tags-${c.id}`}>
                          תגיות (מופרדות בפסיקים)
                        </label>
                        <Input
                          id={`tags-${c.id}`}
                          name="tags"
                          defaultValue={(c.tags ?? []).join(", ")}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium" htmlFor={`n-${c.id}`}>
                          הערות
                        </label>
                        <Textarea id={`n-${c.id}`} name="notes" defaultValue={c.notes ?? ""} />
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" type="submit" className="flex-1">
                          שמירה
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          סגירה
                        </Button>
                      </div>
                    </form>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

