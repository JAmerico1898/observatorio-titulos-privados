/**
 * Formatação única do painel (spec §5).
 * Nenhum `toLocaleString` avulso fora daqui.
 */

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/**
 * R$ em notação compacta. A entrada é sempre em **R$ milhões** — a unidade
 * canônica do pipeline depois de `normalizar` (spec §3.2).
 */
export function formatBRL(milhoes: number | null | undefined, casas = 1): string {
  if (milhoes === null || milhoes === undefined || !Number.isFinite(milhoes)) return "—";
  if (milhoes === 0) return "R$ 0";
  const neg = milhoes < 0;
  const v = Math.abs(milhoes);
  let out: string;
  if (v >= 1_000_000) out = `${fixed(v / 1_000_000, casas)} tri`;
  else if (v >= 1_000) out = `${fixed(v / 1_000, casas)} bi`;
  else if (v >= 1) out = `${fixed(v, casas)} mi`;
  else out = `${fixed(v * 1_000, 0)} mil`;
  return `${neg ? "−" : ""}R$ ${out}`;
}

/**
 * R$ para rótulo de eixo.
 *
 * Arredondar eixo para zero casas colapsa marcas distintas — 1,3 tri e 1,5 tri
 * viravam ambos "2 tri" e o eixo passava a mentir. Uma casa resolve; o ",0"
 * é removido para o rótulo não ficar pesado quando não precisa dela.
 */
export function formatBRLEixo(milhoes: number | null | undefined): string {
  return formatBRL(milhoes, 1).replace(/,0(?= |$)/, "");
}

/** Percentual já em fração (0,52 → "52,0%"). */
export function formatPct(fracao: number | null | undefined, casas = 1): string {
  if (fracao === null || fracao === undefined || !Number.isFinite(fracao)) return "—";
  return `${fixed(fracao * 100, casas)}%`;
}

/** Pontos percentuais, com sinal explícito (0,031 → "+3,1 p.p."). */
export function formatPP(fracao: number | null | undefined, casas = 1): string {
  if (fracao === null || fracao === undefined || !Number.isFinite(fracao)) return "—";
  const v = fracao * 100;
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${fixed(Math.abs(v), casas)} p.p.`;
}

/** Taxa já em % a.a. como o BCB publica (17.6 → "17,6% a.a."). */
export function formatTaxa(pct: number | null | undefined, casas = 1): string {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) return "—";
  return `${fixed(pct, casas)}% a.a.`;
}

/** Variação relativa com sinal (0,013 → "+1,3%"). */
export function formatVar(fracao: number | null | undefined, casas = 1): string {
  if (fracao === null || fracao === undefined || !Number.isFinite(fracao)) return "—";
  const v = fracao * 100;
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${fixed(Math.abs(v), casas)}%`;
}

/**
 * Token de formatação.
 *
 * Os gráficos e a tabela são componentes de cliente e recebem suas colunas de
 * componentes de servidor — uma função não atravessa essa fronteira. Então a
 * página declara *qual* formato quer e o componente resolve do lado dele.
 */
export type Formato =
  | "brl"
  | "brlEixo"
  | "pct"
  | "pct0"
  | "var"
  | "var0"
  | "pp"
  | "taxa"
  | "inteiro";

export function aplicarFormato(formato: Formato, v: number | null | undefined): string {
  switch (formato) {
    case "brl":
      return formatBRL(v);
    case "brlEixo":
      return formatBRLEixo(v);
    case "pct":
      return formatPct(v);
    case "pct0":
      return formatPct(v, 0);
    case "var":
      return formatVar(v);
    case "var0":
      return formatVar(v, 0);
    case "pp":
      return formatPP(v);
    case "taxa":
      return formatTaxa(v);
    case "inteiro":
      return formatInteiro(v);
  }
}

export function formatInteiro(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("pt-BR").format(Math.round(n));
}

/** "2026-06" → "junho de 2026". */
export function formatMes(ym: string | null | undefined): string {
  if (!ym) return "—";
  const [a, m] = ym.split("-");
  const idx = Number(m) - 1;
  if (!MESES[idx]) return ym;
  return `${MESES[idx]} de ${a}`;
}

/** "2026-06" → "jun/26" (eixos de gráfico). */
export function formatMesCurto(ym: string | null | undefined): string {
  if (!ym) return "";
  const [a, m] = ym.split("-");
  const idx = Number(m) - 1;
  if (!MESES[idx]) return ym;
  return `${MESES[idx].slice(0, 3)}/${a.slice(2)}`;
}

/** "2025-12-11" → "11/12/2025". */
export function formatData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [a, m, d] = iso.split("-");
  if (!a || !m || !d) return iso;
  return `${d}/${m}/${a}`;
}

function fixed(v: number, casas: number): string {
  return v.toFixed(casas).replace(".", ",");
}
