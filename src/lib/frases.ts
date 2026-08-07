/**
 * Frases de leitura (spec §5).
 *
 * Toda frase é **derivada dos dados no build**, nunca escrita à mão. Se o
 * número virar no mês que vem, a frase vira junto — uma frase hardcoded seria
 * uma afirmação que envelhece em silêncio, que é exatamente o que a regra 12
 * de Karpathy proíbe.
 */

import { formatBRL, formatMes, formatPct, formatPP, formatTaxa, formatVar } from "@/lib/format";
import { ultimo, var12m, valorEm, mesMenos, type Serie } from "@/lib/transforms";

/** Descreve nível e variação em 12 meses de uma série de estoque. */
export function fraseEstoque(nome: string, s: Serie): string {
  const u = ultimo(s);
  if (!u) return `Sem dado publicado para ${nome}.`;
  const v12 = valorEm(var12m(s), u.mes);
  const base = `Em ${formatMes(u.mes)}, ${nome} somava ${formatBRL(u.valor)}`;
  if (v12 === null) return `${base}.`;
  const dir = v12 > 0 ? "alta" : v12 < 0 ? "queda" : "estabilidade";
  return `${base}, ${dir} de ${formatVar(Math.abs(v12))} em doze meses.`;
}

/** Compara dois canais e nomeia o vencedor no mês corrente. */
export function fraseComparacao(
  nomeA: string,
  a: Serie,
  nomeB: string,
  b: Serie,
  cruzamentoEm: string | null,
): string {
  const ua = ultimo(a);
  const ub = ultimo(b);
  if (!ua || !ub || ua.valor === null || ub.valor === null) return "Dado insuficiente para comparar os dois canais.";
  const maior = ua.valor >= ub.valor ? nomeA : nomeB;
  const menor = ua.valor >= ub.valor ? nomeB : nomeA;
  const vMaior = Math.max(ua.valor, ub.valor);
  const vMenor = Math.min(ua.valor, ub.valor);
  const frase =
    `Em ${formatMes(ua.mes)}, ${maior} (${formatBRL(vMaior)}) supera ${menor} ` +
    `(${formatBRL(vMenor)}), diferença de ${formatBRL(vMaior - vMenor)}.`;
  if (!cruzamentoEm) return frase;
  return `${frase} As duas curvas se cruzaram em ${formatMes(cruzamentoEm)}.`;
}

/** Frase da participação — o número-síntese do painel. */
export function frasePart(part: Serie, partAmpl: Serie): string {
  const u = ultimo(part);
  if (!u || u.valor === null) return "Sem dado de participação para o mês corrente.";
  const d12 = u.valor - (valorEm(part, mesMenos(u.mes, 12)) ?? u.valor);
  const ampl = valorEm(partAmpl, u.mes);
  const parte1 =
    `Sob o perímetro dos dois canais domésticos, o mercado de capitais responde por ` +
    `${formatPct(u.valor)} do financiamento às empresas em ${formatMes(u.mes)}` +
    `, ${formatPP(d12)} em doze meses.`;
  if (ampl === null) return parte1;
  return (
    `${parte1} Medido contra o crédito ampliado, o mesmo fenômeno aparece como ` +
    `${formatPct(ampl)}: a magnitude depende do perímetro, a direção não.`
  );
}

/** Frase de série de taxa (% a.a.). */
export function fraseTaxa(nome: string, s: Serie): string {
  const u = ultimo(s);
  if (!u || u.valor === null) return `Sem dado publicado para ${nome}.`;
  const base = valorEm(s, mesMenos(u.mes, 12));
  const parte1 = `Em ${formatMes(u.mes)}, ${nome} estava em ${formatTaxa(u.valor)}`;
  if (base === null) return `${parte1}.`;
  const d = (u.valor - base) / 100;
  return `${parte1}, ${formatPP(d)} em relação a doze meses antes.`;
}

/** Frase de composição: nomeia a maior fatia e seu peso. */
export function fraseComposicao(
  contexto: string,
  fatias: Array<{ rotulo: string; valor: number | null }>,
  mes: string,
): string {
  const validas = fatias.filter((f): f is { rotulo: string; valor: number } => f.valor !== null);
  if (!validas.length) return `Sem composição publicada para ${contexto}.`;
  const total = validas.reduce((a, f) => a + f.valor, 0);
  if (total === 0) return `Composição zerada para ${contexto} em ${formatMes(mes)}.`;
  const ord = [...validas].sort((a, b) => b.valor - a.valor);
  const top = ord[0];
  const segundo = ord[1];
  const parte1 =
    `Em ${formatMes(mes)}, ${contexto} é dominado por ${top.rotulo}, ` +
    `com ${formatPct(top.valor / total)} do total`;
  if (!segundo) return `${parte1}.`;
  return `${parte1}; ${segundo.rotulo} vem em seguida, com ${formatPct(segundo.valor / total)}.`;
}

/** Frase de variação em 12 meses por instrumento (gráfico de barras). */
export function fraseVar12m(contexto: string, series: Array<{ rotulo: string; s: Serie }>): string {
  const pontos = series
    .map(({ rotulo, s }) => {
      const u = ultimo(s);
      const v = u ? valorEm(var12m(s), u.mes) : null;
      return v === null ? null : { rotulo, v, mes: u!.mes };
    })
    .filter((x): x is { rotulo: string; v: number; mes: string } => x !== null);
  if (!pontos.length) return `Sem variação em doze meses calculável para ${contexto}.`;
  const ord = [...pontos].sort((a, b) => b.v - a.v);
  const alta = ord[0];
  const baixa = ord[ord.length - 1];
  if (ord.length === 1) {
    return `Em ${formatMes(alta.mes)}, ${alta.rotulo} varia ${formatVar(alta.v)} em doze meses.`;
  }
  return (
    `Em ${formatMes(alta.mes)}, ${alta.rotulo} lidera a variação em doze meses ` +
    `(${formatVar(alta.v)}) e ${baixa.rotulo} fecha a lista (${formatVar(baixa.v)}).`
  );
}
