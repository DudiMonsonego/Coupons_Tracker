"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { Camera, Loader2, Sparkles } from "lucide-react";

import type { ParsedCoupon } from "@/lib/ai/parse-coupon";
import { BrandLogo } from "@/components/coupons/brand-logo";
import { CategorySelect } from "@/components/coupons/category-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function str(n: number | null | undefined) {
  return n != null ? String(n) : "";
}

export function AddCouponForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsing, startParse] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [draftImagePath, setDraftImagePath] = useState("");
  const [parseNote, setParseNote] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");
  const [brandName, setBrandName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [couponValue, setCouponValue] = useState("");
  const [couponCost, setCouponCost] = useState("");

  function applyParsed(parsed: ParsedCoupon) {
    setTitle(parsed.title);
    setCode(parsed.code ?? "");
    setExpiryDate(parsed.expiry_date ?? "");
    setNotes(parsed.notes ?? "");
    setTags((parsed.tags ?? []).join(", "));
    setCategory(parsed.category ?? "");
    setBrandName(parsed.brand_name ?? "");
    setLogoUrl(parsed.logo_url ?? "");
    setCouponValue(str(parsed.coupon_value));
    setCouponCost(str(parsed.coupon_cost));
  }

  function onImagePicked(file: File | null) {
    setPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setDraftImagePath("");
    setParseNote(null);

    if (!file) return;

    startParse(async () => {
      const fd = new FormData();
      fd.set("image", file);
      const res = await fetch("/ai/coupon-import", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setParseNote(json.message ?? "לא ניתן למלא אוטומטית — מלא/י ידנית");
        return;
      }

      if (json.draftImagePath) setDraftImagePath(json.draftImagePath);
      if (json.previewUrl) {
        setPreview((prev) => {
          if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
          return json.previewUrl as string;
        });
      }
      applyParsed(json.parsed as ParsedCoupon);
      setParseNote("השדות מולאו מהתמונה — בדוק/י ושמור");
    });
  }

  return (
    <form action="/coupons/create" method="post" encType="multipart/form-data" className="space-y-4">
      {draftImagePath ? (
        <input type="hidden" name="draft_image_path" value={draftImagePath} />
      ) : null}
      {logoUrl ? <input type="hidden" name="logo_url" value={logoUrl} /> : null}

      <div className="rounded-2xl border-2 border-dashed border-violet-400/50 bg-violet-50/80 p-4 dark:border-violet-500/30 dark:bg-violet-950/30">
        <input
          ref={fileRef}
          id="image"
          name={draftImagePath ? undefined : "image"}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => onImagePicked(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-xl py-6 text-center transition hover:bg-violet-100/80 dark:hover:bg-violet-900/40"
        >
          {parsing ? (
            <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
          ) : (
            <Camera className="h-10 w-10 text-violet-600 dark:text-violet-400" />
          )}
          <span className="text-base font-semibold text-violet-900 dark:text-violet-100">
            {parsing ? "מנתח תמונה…" : "צלם / העלה תמונת קופון"}
          </span>
          <span className="text-xs text-violet-700/80 dark:text-violet-300/80">
            התחל כאן — השדות למטה ימולאו אוטומטית
          </span>
        </button>

        {preview ? (
          <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950">
            <Image src={preview} alt="תצוגה מקדימה" fill className="object-contain" unoptimized />
          </div>
        ) : null}

        {parseNote ? (
          <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-violet-800 dark:text-violet-200">
            <Sparkles className="h-3 w-3" />
            {parseNote}
          </p>
        ) : null}
      </div>

      {(brandName || logoUrl) && (
        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900/50">
          <BrandLogo brandName={brandName} logoUrl={logoUrl} size={48} />
          <div className="min-w-0 flex-1 space-y-2">
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              מותג (לוגו אם זוהה בקופון)
            </label>
            <Input
              name="brand_name"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="שם העסק"
            />
          </div>
        </div>
      )}

      {!brandName && !logoUrl ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="brand_name">
            מותג (אופציונלי)
          </label>
          <Input
            id="brand_name"
            name="brand_name"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="שם העסק"
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="title">
          שם
        </label>
        <Input
          id="title"
          name="title"
          required
          placeholder="למשל: 20% הנחה"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="coupon_value">
            שווי הקופון (₪)
          </label>
          <Input
            id="coupon_value"
            name="coupon_value"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="50"
            value={couponValue}
            onChange={(e) => setCouponValue(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="coupon_cost">
            עלות (₪)
          </label>
          <Input
            id="coupon_cost"
            name="coupon_cost"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="20"
            value={couponCost}
            onChange={(e) => setCouponCost(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="category">
          קטגוריה
        </label>
        <CategorySelect value={category} onValueChange={setCategory} />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="code">
          קוד (אופציונלי)
        </label>
        <Input
          id="code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="SAVE20"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="expiry_date">
          תוקף (אופציונלי)
        </label>
        <Input
          id="expiry_date"
          name="expiry_date"
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="tags">
          תגיות (מופרדות בפסיקים)
        </label>
        <Input
          id="tags"
          name="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="אוכל, פארם, קפה"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="notes">
          הערות
        </label>
        <Textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="פרטים נוספים..."
        />
      </div>

      <Button type="submit" className="w-full">
        שמירה
      </Button>
    </form>
  );
}
