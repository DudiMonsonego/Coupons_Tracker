import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { restoreFamilyAccountOnLogin } from "@/lib/auth/get-session-profile";
import { getSiteOrigin } from "@/lib/auth/site-origin";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = getSiteOrigin(request);

  if (!code) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.redirect(new URL("/login?error=config", origin));
  }

  const cookieStore = await cookies();
  const response = NextResponse.redirect(new URL("/", origin));

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=callback&message=${encodeURIComponent(error.message)}`, origin),
    );
  }

  if (data.user) {
    await restoreFamilyAccountOnLogin(data.user.id);
  }

  return response;
}
