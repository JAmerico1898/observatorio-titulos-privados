import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        solido: "bg-brand-blue text-ink-inverse hover:opacity-90",
        contorno: "border border-rule bg-surface text-ink shadow-sm hover:bg-surface-sunken",
        discreto: "font-semibold text-brand-blue hover:opacity-80",
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
