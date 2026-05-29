export type CouponStatus = "active" | "expiring" | "used" | "archived";

export function getCouponStatus(opts: {
  isUsed: boolean;
  expiryDate: string | null;
  expiringSoonDays: number;
  now?: Date;
}): CouponStatus {
  const now = opts.now ?? new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (opts.isUsed) return "used";

  if (!opts.expiryDate) return "active";
  const expiry = new Date(opts.expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (Number.isNaN(expiry.getTime())) return "active";
  if (expiry < today) return "archived";

  const soonCutoff = new Date(today);
  soonCutoff.setDate(soonCutoff.getDate() + opts.expiringSoonDays);
  if (expiry <= soonCutoff) return "expiring";

  return "active";
}

/** Active tab includes coupons that are still valid, including expiring soon. */
export function isShownInActiveTab(status: CouponStatus) {
  return status === "active" || status === "expiring";
}

