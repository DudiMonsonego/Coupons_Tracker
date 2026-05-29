export const COUPON_CATEGORIES = [
  { id: "food", label: "אוכל ומשקאות" },
  { id: "shopping", label: "קניות ופארם" },
  { id: "entertainment", label: "בילוי ופנאי" },
  { id: "fashion", label: "אופנה ויופי" },
  { id: "tech", label: "טכנולוגיה" },
  { id: "travel", label: "נסיעות" },
  { id: "health", label: "בריאות וספורט" },
  { id: "home", label: "בית וגן" },
  { id: "other", label: "אחר" },
] as const;

export type CouponCategoryId = (typeof COUPON_CATEGORIES)[number]["id"];

const CATEGORY_IDS = new Set<string>(COUPON_CATEGORIES.map((c) => c.id));

const LABEL_TO_ID = new Map(
  COUPON_CATEGORIES.map((c) => [c.label.toLowerCase(), c.id]),
);

export function getCategoryLabel(id: string | null | undefined) {
  if (!id) return null;
  return COUPON_CATEGORIES.find((c) => c.id === id)?.label ?? null;
}

export function normalizeCategory(value: unknown): CouponCategoryId | null {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  const lower = raw.toLowerCase();

  if (CATEGORY_IDS.has(lower)) {
    return lower as CouponCategoryId;
  }

  const fromLabel = LABEL_TO_ID.get(raw.toLowerCase());
  if (fromLabel) return fromLabel;

  // Common English aliases from AI
  const aliases: Record<string, CouponCategoryId> = {
    food: "food",
    restaurant: "food",
    cafe: "food",
    grocery: "shopping",
    supermarket: "shopping",
    pharmacy: "shopping",
    shopping: "shopping",
    retail: "shopping",
    entertainment: "entertainment",
    cinema: "entertainment",
    fashion: "fashion",
    beauty: "fashion",
    cosmetics: "fashion",
    technology: "tech",
    electronics: "tech",
    travel: "travel",
    hotel: "travel",
    health: "health",
    fitness: "health",
    sports: "health",
    home: "home",
    garden: "home",
    other: "other",
  };

  return aliases[lower] ?? null;
}

export function categoryIdsForAiPrompt() {
  return COUPON_CATEGORIES.map((c) => `${c.id} (${c.label})`).join(", ");
}
