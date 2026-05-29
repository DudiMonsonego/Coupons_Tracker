import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-[96px] w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-black/10 dark:border-white/10 dark:bg-zinc-950 dark:focus-visible:ring-white/10",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };

