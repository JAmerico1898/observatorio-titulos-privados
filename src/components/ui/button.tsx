import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius)] text-sm transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        solido: "bg-ink text-ink-inverse hover:bg-ink-2",
        contorno: "border border-rule-strong bg-surface text-ink hover:bg-surface-sunken",
        discreto: "text-ink-2 underline underline-offset-4 hover:text-ink",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-9 px-4",
        inline: "h-auto p-0",
      },
    },
    defaultVariants: { variant: "contorno", size: "sm" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
