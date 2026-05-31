import type { ChangeEvent } from "react";

import { COUPON_CATEGORIES } from "@/lib/coupons/categories";

type Props = {
  id?: string;
  name?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  className?: string;
};

export function CategorySelect({
  id = "category",
  name = "category",
  defaultValue = "",
  value,
  onValueChange,
  required = false,
  className,
}: Props) {
  const selectProps =
    value !== undefined
      ? {
          value,
          onChange: (e: ChangeEvent<HTMLSelectElement>) => onValueChange?.(e.target.value),
        }
      : { defaultValue };

  return (
    <select
      id={id}
      name={name}
      required={required}
      className={
        className ??
        "flex h-10 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-white/10 dark:bg-zinc-950"
      }
      {...selectProps}
    >
      <option value="">בחר קטגוריה</option>
      {COUPON_CATEGORIES.map((c) => (
        <option key={c.id} value={c.id}>
          {c.label}
        </option>
      ))}
    </select>
  );
}
