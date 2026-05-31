import Link from "next/link";

export function SchemaMissingBanner() {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-50 p-6 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
      <h2 className="text-lg font-semibold">נדרש עדכון מסד נתונים</h2>
      <p className="mt-2">
        חסרות עמודות בטבלת <code className="rounded bg-black/10 px-1">coupons</code> ב-Supabase
        (למשל <code className="rounded bg-black/10 px-1">coupon_value</code>).
      </p>
      <ol className="mt-3 list-decimal space-y-1 ps-5">
        <li>פתח/י את Supabase → SQL Editor</li>
        <li>העתק/י והרץ/י את הקובץ <code className="rounded bg-black/10 px-1">supabase/apply-all-schema.sql</code></li>
        <li>רענן/י את הדף</li>
      </ol>
      <Link
        href="/coupons"
        className="mt-4 inline-block font-medium text-violet-700 underline dark:text-violet-300"
      >
        חזרה לקופונים
      </Link>
    </div>
  );
}
