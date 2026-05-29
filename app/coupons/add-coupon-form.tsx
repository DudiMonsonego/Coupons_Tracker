"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

import { CategorySelect } from "@/components/coupons/category-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AddCouponForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function onFileChange(file: File | null) {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  return (
    <form action="/coupons/create" method="post" encType="multipart/form-data" className="space-y-3">
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="title">
          שם
        </label>
        <Input id="title" name="title" required placeholder="למשל: 20% הנחה" />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="category">
          קטגוריה
        </label>
        <CategorySelect />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="code">
          קוד (אופציונלי)
        </label>
        <Input id="code" name="code" placeholder="SAVE20" />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="expiry_date">
          תוקף (אופציונלי)
        </label>
        <Input id="expiry_date" name="expiry_date" type="date" />
      </div>

      <div className="rounded-xl border border-dashed border-black/15 bg-zinc-50 p-3 dark:border-white/15 dark:bg-zinc-900/40">
        <label className="flex items-center gap-2 text-sm font-medium" htmlFor="image">
          <ImagePlus className="h-4 w-4" />
          תמונת קופון (אופציונלי)
        </label>
        <input
          ref={fileRef}
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="mt-2 block w-full text-sm"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
        {preview ? (
          <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
            <Image src={preview} alt="תצוגה מקדימה" fill className="object-contain" unoptimized />
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="tags">
          תגיות (מופרדות בפסיקים)
        </label>
        <Input id="tags" name="tags" placeholder="אוכל, פארם, קפה" />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="notes">
          הערות
        </label>
        <Textarea id="notes" name="notes" placeholder="פרטים נוספים..." />
      </div>

      <Button type="submit" className="w-full">
        שמירה
      </Button>
    </form>
  );
}
