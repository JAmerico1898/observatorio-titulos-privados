"use client";

import { useId, useState } from "react";
import { Table2 } from "lucide-react";

import { DataTable, type ColunaTabela, type LinhaTabela } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import type { IndicadorId } from "@/data/indicadores";
import { Button } from "@/components/ui/button";
import { formatData } from "@/lib/format";

export type ChartBlockProps = {
  titulo: string;
  /** Procedência do dado — o dispositivo estrutural do painel. */
  fonte: string;
  /**
   * Frase de leitura obrigatória (spec §5). Gerada no build a partir dos
   * dados, nunca escrita à mão — se o dado mudar, a frase muda junto.
   */
  frase: string;
  children: React.ReactNode;
  colunas: ColunaTabela[];
  linhas: LinhaTabela[];
  /** Id em `src/data/indicadores.ts`; presente, exibe o selo "cálculo próprio". */
  indicador?: IndicadorId;
  /** Série encerrada: leva marcação própria e a data de corte no título. */
  congeladoEm?: string;
  notaCongelado?: string;
};

export function ChartBlock({
  titulo,
  fonte,
  frase,
  children,
  colunas,
  linhas,
  indicador,
  congeladoEm,
  notaCongelado,
}: ChartBlockProps) {
  const [mostrarTabela, setMostrarTabela] = useState(false);
  const idTabela = useId();
  const congelado = Boolean(congeladoEm);

  return (
    <figure
      data-chart-block
      data-congelado={congelado ? "true" : undefined}
      className={
        congelado
          ? "rounded-[var(--radius)] border border-frozen-rule bg-frozen-bg/40 p-5"
          : "rounded-[var(--radius)] border border-rule bg-surface p-5"
      }
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="eyebrow">{fonte}</span>
          <h3 className="font-display text-lg leading-tight font-medium text-ink">
            {titulo}
            {congeladoEm && (
              <span className="text-ink-3"> — encerrada em {formatData(congeladoEm)}</span>
            )}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {congelado && <Badge variant="congelado">série encerrada</Badge>}
          {indicador && <Badge variant="calculo">cálculo próprio</Badge>}
        </div>
      </div>

      <div>{children}</div>

      <figcaption className="mt-4 space-y-3">
        <p data-frase-leitura className="max-w-prose text-sm leading-relaxed text-ink-2">
          {frase}
        </p>

        {notaCongelado && (
          <p className="max-w-prose text-xs leading-relaxed text-frozen-ink">{notaCongelado}</p>
        )}

        <Button
          variant="discreto"
          size="inline"
          aria-expanded={mostrarTabela}
          aria-controls={idTabela}
          onClick={() => setMostrarTabela((v) => !v)}
          className="text-xs"
        >
          <Table2 aria-hidden className="size-3.5" />
          {mostrarTabela ? "ocultar tabela" : "ver em tabela"}
        </Button>

        <div id={idTabela} hidden={!mostrarTabela}>
          {mostrarTabela && (
            <DataTable colunas={colunas} linhas={linhas} legenda={`${titulo} — dados`} />
          )}
        </div>
      </figcaption>
    </figure>
  );
}
