export function parseMoneyInput(value: FormDataEntryValue | null | undefined): number | null {
  if (value == null) return null;
  const raw = String(value).trim().replace(/,/g, "");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export function formatMoneyILS(amount: number | null | undefined) {
  if (amount == null || Number.isNaN(amount)) return null;
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function extractMoneyFromText(text: string): { value?: number; cost?: number } {
  const amounts: number[] = [];
  const shekelMatches = text.matchAll(/(?:₪|ש[\"״']?ח)\s*([\d]+(?:[.,]\d{1,2})?)/gi);
  for (const m of shekelMatches) {
    const n = Number(m[1].replace(",", "."));
    if (Number.isFinite(n)) amounts.push(n);
  }
  if (amounts.length === 0) {
    const bare = text.match(/\b([\d]+(?:[.,]\d{1,2})?)\s*(?:₪|שח|ש\"ח)/gi);
    if (bare) {
      for (const m of bare) {
        const num = m.match(/([\d]+(?:[.,]\d{1,2})?)/);
        if (num) {
          const n = Number(num[1].replace(",", "."));
          if (Number.isFinite(n)) amounts.push(n);
        }
      }
    }
  }
  if (amounts.length === 0) return {};
  if (amounts.length === 1) return { value: amounts[0] };
  return { value: Math.max(...amounts), cost: Math.min(...amounts) };
}
