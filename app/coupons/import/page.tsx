import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CouponImportClient } from "@/app/coupons/import/ui";

export const dynamic = "force-dynamic";

export default function CouponImportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ייבוא קופון</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            הדביקו טקסט (או העלו תמונה בשלב הבא) וקבלו טיוטה שממנה ניתן לשמור קופון.
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">חזרה</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>קלט</CardTitle>
            <CardDescription>טקסט מהקופון</CardDescription>
          </CardHeader>
          <CardContent>
            <CouponImportClient />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

