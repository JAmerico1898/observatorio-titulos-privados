import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.625rem] leading-none font-semibold tracking-widest whitespace-nowrap uppercase",
  {
    variants: {
      variant: {
        neutro: "bg-surface-sunken text-ink-2",
        /** Selo "cálculo próprio" (spec §3.3). */
        calculo: "bg-seal-bg text-seal-ink",
        /** Bloco de série encerrada (spec §5). */
        congelado: "bg-frozen-bg text-frozen-ink ring-1 ring-frozen-rule",
      },
    },
    defaultVariants: { variant: "neutro" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
