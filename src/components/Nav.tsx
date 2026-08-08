"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

import { PAGINAS } from "@/data/paginas";
import { cn } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
        <Link
          href="/"
          className="font-display text-base font-extrabold tracking-tight text-ink"
        >
          Observatório de Títulos Privados
        </Link>
        <nav aria-label="Seções do painel" className="flex flex-1 flex-wrap gap-1.5">
          {PAGINAS.map((p) => {
            const ativo = p.href === "/" ? pathname === "/" : pathname === p.href;
            return (
              <Link
                key={p.href}
                href={p.href}
                aria-current={ativo ? "page" : undefined}
                className={cn("pill", ativo && "pill-ativa")}
              >
                {p.href === "/" && <Home aria-hidden className="size-3.5" />}
                {p.rotulo}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
