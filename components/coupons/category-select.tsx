import { COUPON_CATEGORIES } from "@/lib/coupons/categories";

type Props = {
  id?: string;
  name?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
};

export function CategorySelect({
  id = "category",
  name = "category",
  defaultValue = "",
  required = false,
  className,
}: Props) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue}
      required={required}
      className={
        className ??
        "flex h-10 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-white/10 dark:bg-zinc-950"
      }
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
