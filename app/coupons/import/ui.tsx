"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { ImagePlus, Sparkles } from "lucide-react";

import { CategorySelect } from "@/components/coupons/category-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ParsedCoupon = {
  title: string;
  code?: string;
  expiry_date?: string;
  notes?: string;
  tags?: string[];
  category?: string | null;
};

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
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  function parse() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      if (text.trim()) fd.set("text", text);
      if (imageFile) fd.set("image", imageFile);

      const res = await fetch("/ai/coupon-import", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.message ?? "שגיאה");
        return;
      }
      setParsed(json.parsed);
      setDraftImagePath(json.draftImagePath ?? null);
      setStoredPreviewUrl(json.previewUrl ?? imagePreview);
    });
  }

  const previewSrc = storedPreviewUrl ?? imagePreview;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-black/15 bg-zinc-50 p-4 dark:border-white/15 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ImagePlus className="h-4 w-4" />
          תמונת קופון
        </div>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          התמונה נשמרת ב-Supabase Storage בתיקייה של המשפחה שלך בלבד.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="mt-3 block w-full text-sm"
          onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
        />
        {previewSrc ? (
          <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
            <Image
              src={previewSrc}
              alt="תצוגה מקדימה"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        ) : null}
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="אופציונלי: הדבק/י טקסט מהקופון (משפר ניתוח בלי OpenAI)…"
      />

      <Button
        type="button"
        onClick={parse}
        disabled={pending || (!text.trim() && !imageFile)}
        className="w-full"
      >
        <Sparkles className="h-4 w-4" />
        ניתוח
      </Button>

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {parsed ? (
        <form action="/coupons/create" method="post" encType="multipart/form-data" className="space-y-3">
          <div className="text-sm font-semibold">טיוטה</div>

          {draftImagePath ? (
            <input type="hidden" name="draft_image_path" value={draftImagePath} />
          ) : null}

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="title">
              שם
            </label>
            <Input id="title" name="title" defaultValue={parsed.title} required />
          </div>

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
