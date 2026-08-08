"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PAGINAS } from "@/data/paginas";
import { cn } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-baseline gap-x-6 gap-y-2 px-5 py-3">
        <Link href="/" className="font-display text-base font-semibold tracking-tight text-ink">
          Observatório de Títulos Privados
        </Link>
        <nav aria-label="Seções do painel" className="flex flex-wrap gap-x-4 gap-y-1">
          {PAGINAS.slice(1).map((p) => {
            const ativo = pathname === p.href;
            return (
              <Link
                key={p.href}
                href={p.href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "text-[0.8125rem] leading-tight transition-colors",
                  ativo
                    ? "text-ink underline decoration-2 underline-offset-[6px]"
                    : "text-ink-2 hover:text-ink",
                )}
              >
                {p.rotulo}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
