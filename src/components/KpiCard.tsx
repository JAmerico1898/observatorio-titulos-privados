import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { IndicadorId } from "@/data/indicadores";
import { formatMes, formatPP, formatVar } from "@/lib/format";
import { cn } from "@/lib/utils";

export type KpiCardProps = {
  rotulo: string;
  /** Já formatado — o card não decide formatação de grandeza. */
  valor: string;
  /** Procedência: "SGS 28851 · BCB" ou "CVM". */
  fonte: string;
  mes: string;
  /**
   * Variação vs. mês anterior, em fração.
   * `tipo` decide a unidade impressa: série de estoque varia em %, série que
   * já é taxa varia em p.p. — misturar as duas é o erro clássico de leitura.
   */
  variacao?: number | null;
  tipoVariacao?: "percentual" | "pp";
  /**
   * Se a variação carrega juízo de valor.
   *
   * `neutra` é o padrão e vale para todo estoque e toda medida estrutural —
   * um estoque que sobe não é "bom", e a participação do mercado de capitais
   * subir não é "boa" nem "ruim", é o fenômeno que o painel mede. Só custo do
   * crédito usa `menor-melhor`, onde alta realmente é deterioração para quem
   * toma o empréstimo.
   */
  semantica?: "neutra" | "menor-melhor";
  /**
   * Id de um indicador de `src/data/indicadores.ts`. Presente, o card exibe o
   * selo "cálculo próprio"; ausente, o número é exibido tal como a fonte publica.
   * É referência a registro, não booleano, para que o portão possa conferir que
   * todo selo tem fórmula publicada em Sobre.
   */
  indicador?: IndicadorId;
  nota?: string;
};

export function KpiCard({
  rotulo,
  valor,
  fonte,
  mes,
  variacao = null,
  tipoVariacao = "percentual",
  semantica = "neutra",
  indicador,
  nota,
}: KpiCardProps) {
  const direcao = variacao === null ? "flat" : variacao > 0 ? "up" : variacao < 0 ? "down" : "flat";
  const Icone = direcao === "up" ? ArrowUpRight : direcao === "down" ? ArrowDownRight : ArrowRight;
  const textoVariacao =
    tipoVariacao === "pp" ? formatPP(variacao) : formatVar(variacao);

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-rule bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="eyebrow">{fonte}</span>
        {indicador && <Badge variant="calculo">cálculo próprio</Badge>}
      </div>

      <p className="text-sm leading-snug text-ink-2">{rotulo}</p>

      <p className="tnum text-2xl leading-none font-medium text-ink">{valor}</p>

      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-xs">
        {variacao !== null && (
          <span
            className={cn(
              "tnum inline-flex items-center gap-0.5",
              semantica === "menor-melhor"
                ? direcao === "up"
                  ? "text-var-down"
                  : direcao === "down"
                    ? "text-var-up"
                    : "text-var-flat"
                : "text-var-flat",
            )}
          >
            <Icone aria-hidden className="size-3.5" />
            {textoVariacao}
            <span className="sr-only">
              {tipoVariacao === "pp" ? "em pontos percentuais" : "em percentual"} vs. mês anterior
            </span>
          </span>
        )}
        <span className="text-ink-3">{formatMes(mes)}</span>
      </div>

      {nota && <p className="text-xs leading-snug text-ink-3">{nota}</p>}
    </div>
  );
}
