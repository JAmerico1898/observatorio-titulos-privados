import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius)] px-1.5 py-0.5 font-mono text-[0.6875rem] leading-none tracking-wide uppercase",
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
