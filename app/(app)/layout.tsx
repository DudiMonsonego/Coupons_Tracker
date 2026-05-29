import Link from "next/link";
import { Home, Settings, Sparkles, TicketPercent, Users } from "lucide-react";

import { SignOutButton } from "@/app/components/sign-out-button";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/", label: "בית", icon: Home },
  { href: "/coupons", label: "קופונים", icon: TicketPercent },
  { href: "/coupons/import", label: "ייבוא", icon: Sparkles },
  { href: "/settings/family", label: "משפחה", icon: Users },
  { href: "/settings/household", label: "הגדרות", icon: Settings },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionProfile();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-zinc-50 to-white dark:from-black dark:to-zinc-950">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black">
              <TicketPercent className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">קופונים</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                {session.displayName ?? session.email ?? ""}
              </div>
            </div>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <nav className="hidden md:block">
          <div className="space-y-1 rounded-2xl border border-black/10 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-zinc-950">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-black/[0.04] dark:text-zinc-100 dark:hover:bg-white/[0.06]",
                )}
              >
                <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                {label}
              </Link>
            ))}
          </div>
        </nav>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

