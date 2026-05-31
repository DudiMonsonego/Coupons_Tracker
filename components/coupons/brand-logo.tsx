"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  brandName?: string | null;
  logoUrl?: string | null;
  size?: number;
  className?: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function BrandLogo({ brandName, logoUrl, size = 40, className }: Props) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = logoUrl && !logoFailed;

  if (!showLogo && !brandName) return null;

  const style = { width: size, height: size };

  return (
    <div
      className={
        className ??
        "relative shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900"
      }
      style={style}
    >
      {showLogo ? (
        <Image
          src={logoUrl}
          alt={brandName ?? "לוגו"}
          fill
          className="object-contain p-1"
          unoptimized
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-violet-100 text-xs font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-200"
          aria-hidden
        >
          {initials(brandName ?? "?")}
        </div>
      )}
    </div>
  );
}
