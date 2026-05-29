import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-black/10 dark:border-white/10 dark:bg-zinc-950 dark:focus-visible:ring-white/10",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

