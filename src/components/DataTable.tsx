import { aplicarFormato, formatMes, type Formato } from "@/lib/format";

export type ColunaTabela = {
  chave: string;
  rotulo: string;
  /** Token serializável — a página escolhe, a tabela resolve (ver `Formato`). */
  formato: Formato;
};

export type LinhaTabela = { mes: string } & Record<string, number | null | string>;

/**
 * Tabela alternativa acoplada a todo gráfico (spec §5).
 *
 * Não é um extra de acessibilidade: é o "relief" exigido pela paleta, cujas
 * cores mais claras ficam abaixo de 3:1 contra a superfície. Sem ela, os
 * gráficos com essas séries não seriam legíveis para todo mundo.
 */
export function DataTable({
  colunas,
  linhas,
  legenda,
  maxLinhas = 200,
}: {
  colunas: ColunaTabela[];
  linhas: LinhaTabela[];
  legenda: string;
  maxLinhas?: number;
}) {
  // Mais recente primeiro: é o que o leitor procura.
  const visiveis = [...linhas].reverse().slice(0, maxLinhas);

  return (
    <div className="max-h-96 overflow-auto rounded-[var(--radius)] border border-rule">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{legenda}</caption>
        <thead className="sticky top-0 bg-surface-sunken">
          <tr>
            <th scope="col" className="border-b border-rule px-3 py-2 text-left font-medium text-ink-2">
              Mês
            </th>
            {colunas.map((c) => (
              <th
                key={c.chave}
                scope="col"
                className="border-b border-rule px-3 py-2 text-right font-medium text-ink-2"
              >
                {c.rotulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visiveis.map((l) => (
            <tr key={l.mes} className="even:bg-surface-sunken/40">
              <th scope="row" className="px-3 py-1.5 text-left font-normal whitespace-nowrap text-ink-2">
                {formatMes(l.mes)}
              </th>
              {colunas.map((c) => (
                <td key={c.chave} className="tnum px-3 py-1.5 text-right text-ink">
                  {aplicarFormato(c.formato, typeof l[c.chave] === "number" ? (l[c.chave] as number) : null)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
