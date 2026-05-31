"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { Camera, Loader2, ImagePlus, Sparkles } from "lucide-react";

import type { ParsedCoupon } from "@/lib/ai/parse-coupon";
import { BrandLogo } from "@/components/coupons/brand-logo";
import { CategorySelect } from "@/components/coupons/category-select";
import { MoneyFields } from "@/components/coupons/money-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function str(n: number | null | undefined) {
  return n != null ? String(n) : "";
}

export function CouponImportClient() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCoupon | null>(null);
  const [draftImagePath, setDraftImagePath] = useState<string | null>(null);
  const [storedPreviewUrl, setStoredPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onImageChange(file: File | null) {
    setImageFile(file);
    setImagePreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setParsed(null);
    setDraftImagePath(null);

    if (!file) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.set("image", file);
      if (text.trim()) fd.set("text", text);
      const res = await fetch("/ai/coupon-import", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.message ?? "שגיאה");
        return;
      }
      setError(null);
      setParsed(json.parsed);
      setDraftImagePath(json.draftImagePath ?? null);
      if (json.previewUrl) {
        setStoredPreviewUrl(json.previewUrl);
      }
    });
  }

  function parseText() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("text", text);
      const res = await fetch("/ai/coupon-import", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.message ?? "שגיאה");
        return;
      }
      setParsed(json.parsed);
      setDraftImagePath(json.draftImagePath ?? null);
    });
  }

  const previewSrc = storedPreviewUrl ?? imagePreview;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-dashed border-violet-400/50 bg-violet-50/80 p-4 dark:border-violet-500/30 dark:bg-violet-950/30">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-xl py-5 text-center"
        >
          {pending && imageFile ? (
            <Loader2 className="h-9 w-9 animate-spin text-violet-600" />
          ) : (
            <Camera className="h-9 w-9 text-violet-600" />
          )}
          <span className="font-semibold text-violet-900 dark:text-violet-100">
            העלה תמונת קופון
          </span>
        </button>
        {previewSrc ? (
          <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
            <Image src={previewSrc} alt="תצוגה מקדימה" fill className="object-contain" unoptimized />
          </div>
        ) : null}
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="אופציונלי: טקסט מהקופון…"
      />

      <Button
        type="button"
        onClick={parseText}
        disabled={pending || !text.trim()}
        variant="outline"
        className="w-full"
      >
        <Sparkles className="h-4 w-4" />
        ניתוח טקסט בלבד
      </Button>

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {parsed ? (
        <form action="/coupons/create" method="post" encType="multipart/form-data" className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ImagePlus className="h-4 w-4" />
            טיוטה
          </div>

          {draftImagePath ? (
            <input type="hidden" name="draft_image_path" value={draftImagePath} />
          ) : null}
          {parsed.logo_url ? (
            <input type="hidden" name="logo_url" value={parsed.logo_url} />
          ) : null}

          {(parsed.brand_name || parsed.logo_url) && (
            <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900/50">
              <BrandLogo brandName={parsed.brand_name} logoUrl={parsed.logo_url} size={48} />
              <div className="flex-1 space-y-2">
                <label className="block text-xs font-medium" htmlFor="brand_name">
                  מותג
                </label>
                <Input
                  id="brand_name"
                  name="brand_name"
                  defaultValue={parsed.brand_name ?? ""}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="title">
              שם
            </label>
            <Input id="title" name="title" defaultValue={parsed.title} required />
          </div>

          <MoneyFields
            valueDefault={str(parsed.coupon_value)}
            costDefault={str(parsed.coupon_cost)}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="category">
              קטגוריה {parsed.category ? "(הוצעה ע״י AI)" : ""}
            </label>
            <CategorySelect
              key={`cat-${parsed.category ?? "none"}-${parsed.title}`}
              defaultValue={parsed.category ?? ""}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="code">
              קוד
            </label>
            <Input id="code" name="code" defaultValue={parsed.code ?? ""} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="expiry_date">
              תוקף
            </label>
            <Input
              id="expiry_date"
              name="expiry_date"
              type="date"
              defaultValue={parsed.expiry_date ?? ""}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="tags">
              תגיות
            </label>
            <Input id="tags" name="tags" defaultValue={(parsed.tags ?? []).join(", ")} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="notes">
              הערות
            </label>
            <Textarea id="notes" name="notes" defaultValue={parsed.notes ?? ""} />
          </div>

          <Button type="submit" className="w-full">
            שמירה כקופון
          </Button>
        </form>
      ) : null}
    </div>
  );
}
