/**
 * Resolve the public site origin for OAuth redirects (Vercel, local dev, etc.)
 */
export function getSiteOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim();
    if (host) {
      return `${forwardedProto}://${host}`;
    }
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl && !siteUrl.includes("localhost")) {
    return siteUrl.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}

export function authCallbackUrl(request: Request): string {
  return `${getSiteOrigin(request)}/auth/callback`;
}
