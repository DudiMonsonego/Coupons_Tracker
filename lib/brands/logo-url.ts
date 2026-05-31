/** Build a public logo URL when we know the brand domain (e.g. from AI OCR). */
export function resolveBrandLogoUrl(opts: {
  brandDomain?: string | null;
  hasBrandLogo?: boolean;
}): string | null {
  if (!opts.hasBrandLogo && !opts.brandDomain) return null;

  const domain = normalizeDomain(opts.brandDomain);
  if (!domain) return null;

  return `https://logo.clearbit.com/${domain}`;
}

function normalizeDomain(input: string | null | undefined) {
  if (!input) return null;
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/^www\./, "");
  d = d.split("/")[0]?.split("?")[0] ?? "";
  if (!d.includes(".")) return null;
  return d;
}
