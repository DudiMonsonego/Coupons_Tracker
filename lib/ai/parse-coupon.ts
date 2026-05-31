import { resolveBrandLogoUrl } from "@/lib/brands/logo-url";
import {
  categoryIdsForAiPrompt,
  normalizeCategory,
  type CouponCategoryId,
} from "@/lib/coupons/categories";
import { extractMoneyFromText } from "@/lib/coupons/money";

export type ParsedCoupon = {
  title: string;
  code?: string;
  expiry_date?: string;
  notes?: string;
  tags?: string[];
  category?: CouponCategoryId | null;
  brand_name?: string | null;
  brand_domain?: string | null;
  logo_url?: string | null;
  coupon_value?: number | null;
  coupon_cost?: number | null;
};

export function parseCouponFromText(text: string): ParsedCoupon {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const parsed: ParsedCoupon = {
    title: lines[0] ?? "קופון חדש",
    notes: text || undefined,
    tags: [],
  };

  const codeMatch =
    text.match(/(?:CODE|קוד)\s*[:：]\s*([A-Z0-9_-]{3,})/i) ??
    text.match(/\b([A-Z0-9]{6,})\b/);
  if (codeMatch?.[1]) parsed.code = codeMatch[1];

  const dateMatch = text.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (dateMatch) {
    const yyyy = dateMatch[1];
    const mm = String(dateMatch[2]).padStart(2, "0");
    const dd = String(dateMatch[3]).padStart(2, "0");
    parsed.expiry_date = `${yyyy}-${mm}-${dd}`;
  }

  parsed.category = guessCategoryFromText(text);
  const money = extractMoneyFromText(text);
  parsed.coupon_value = money.value ?? null;
  parsed.coupon_cost = money.cost ?? null;
  parsed.brand_name = guessBrandFromText(text);
  parsed.logo_url = resolveBrandLogoUrl({
    brandDomain: parsed.brand_domain,
    hasBrandLogo: Boolean(parsed.brand_name),
  });
  return parsed;
}

function guessBrandFromText(text: string): string | null {
  const firstLine = text.split("\n").map((l) => l.trim()).filter(Boolean)[0];
  if (!firstLine || firstLine.length > 40) return null;
  if (/^\d|₪|קוד|CODE/i.test(firstLine)) return null;
  return firstLine;
}

function guessCategoryFromText(text: string): CouponCategoryId | null {
  const t = text.toLowerCase();
  if (/מסעד|אוכל|קפה|פיצה|burger|food|restaurant|cafe/.test(t)) return "food";
  if (/סופר|פארם|קניות|pharmacy|grocery|supermarket/.test(t)) return "shopping";
  if (/קולנוע|בילוי|cinema|entertainment/.test(t)) return "entertainment";
  if (/אופנה|יופי|beauty|fashion/.test(t)) return "fashion";
  if (/טכנולוג|electronics|tech/.test(t)) return "tech";
  if (/נסיע|מלון|travel|hotel/.test(t)) return "travel";
  if (/ספורט|בריאות|gym|fitness|health/.test(t)) return "health";
  if (/בית|גן|home|garden/.test(t)) return "home";
  return null;
}

export async function parseCouponFromImage(
  imageBytes: ArrayBuffer,
  mimeType: string,
): Promise<ParsedCoupon> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const base64 = Buffer.from(imageBytes).toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You extract coupon/voucher fields from images. Return JSON only with keys: title (string), code (string or null), expiry_date (YYYY-MM-DD or null), notes (string or null), tags (array of strings), category (one of these ids: ${categoryIdsForAiPrompt()}), brand_name (string or null), brand_domain (company website domain like "mcdonalds.co.il" or null), coupon_value (number or null, benefit face value in ILS), coupon_cost (number or null, price paid in ILS), has_brand_logo (boolean, true if a company logo is clearly visible on the coupon). Pick the best matching category. Understand Hebrew and English.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract coupon fields from this image.",
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI request failed: ${errText}`);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Invalid OpenAI response");
  }

  const raw = JSON.parse(content) as Record<string, unknown>;
  const title = String(raw.title ?? "").trim() || "קופון חדש";
  const code = raw.code != null ? String(raw.code).trim() : undefined;
  const expiry_date =
    raw.expiry_date != null ? String(raw.expiry_date).trim() : undefined;
  const notes = raw.notes != null ? String(raw.notes).trim() : undefined;
  const tags = Array.isArray(raw.tags)
    ? raw.tags.map((t) => String(t).trim()).filter(Boolean)
    : [];

  const category = normalizeCategory(raw.category);
  const brand_name = raw.brand_name != null ? String(raw.brand_name).trim() : null;
  const brand_domain =
    raw.brand_domain != null ? String(raw.brand_domain).trim() : null;
  const coupon_value = parseNum(raw.coupon_value);
  const coupon_cost = parseNum(raw.coupon_cost);
  const has_brand_logo = raw.has_brand_logo === true;
  const logo_url = resolveBrandLogoUrl({ brandDomain: brand_domain, hasBrandLogo: has_brand_logo });

  return {
    title,
    code: code || undefined,
    expiry_date: expiry_date || undefined,
    notes: notes || undefined,
    tags,
    category,
    brand_name: brand_name || null,
    brand_domain: brand_domain || null,
    logo_url,
    coupon_value,
    coupon_cost,
  };
}

function parseNum(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}
