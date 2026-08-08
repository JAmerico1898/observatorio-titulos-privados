import Link from "next/link";

import { meta } from "@/lib/dados";
import { formatMes } from "@/lib/format";

export function Rodape() {
  const processado = new Date(meta.processadoEm);
  return (
    <footer className="border-t border-rule bg-surface">
      <div className="mx-auto grid w-full max-w-[1180px] gap-6 px-5 py-8 text-sm sm:grid-cols-3">
        <div className="space-y-1">
          <p className="font-display text-base font-medium text-ink">Observatório de Títulos Privados</p>
          <p className="text-ink-2">Laboratório de Mercado Financeiro</p>
          <p className="text-ink-3">COPPEAD–FGV–UCAM</p>
        </div>

        <div className="space-y-1">
          <p className="eyebrow">Fontes</p>
          <ul className="space-y-0.5 text-ink-2">
            {meta.fontes.map((f) => (
              <li key={f.nome}>
                {f.nome} <span className="text-ink-3">· {f.ultimoPeriodo}</span>
              </li>
            ))}
          </ul>
          <p>
            <Link href="/sobre" className="text-ink-2 underline underline-offset-4 hover:text-ink">
              Metodologia e limitações
            </Link>
          </p>
        </div>

        <div className="space-y-1">
          <p className="eyebrow">Processamento</p>
          <p className="tnum text-ink-2">
            {processado.toLocaleDateString("pt-BR")} às {processado.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-ink-3">
            Mês de referência: {formatMes(meta.mesReferencia)}
          </p>
          <p className="pt-2 text-xs leading-relaxed text-ink-3">
            Painel independente, sem vínculo com BCB, CVM ou B3.
          </p>
        </div>
      </div>
    </footer>
  );
}
