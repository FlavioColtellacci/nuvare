import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-white/40",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black hover:bg-white/90 active:bg-white/80 shadow-sm",
        secondary:
          "bg-white/10 text-white border border-white/15 hover:bg-white/15",
        ghost: "text-white/70 hover:text-white hover:bg-white/10",
      },
      size: {
        default: "h-10 px-4 py-2",
        lg: "h-11 px-6 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
