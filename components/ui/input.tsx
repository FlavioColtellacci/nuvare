import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-md border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 transition-colors outline-none focus-visible:border-white/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
