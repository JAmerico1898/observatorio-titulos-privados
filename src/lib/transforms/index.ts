/**
 * Motor de transformação (spec §6). Funções puras, sem I/O.
 *
 * Regra que atravessa o arquivo inteiro: **mês faltante propaga `null`**.
 * Nunca interpolar — o gráfico interrompe a linha e o leitor vê a quebra.
 */

/** Ponto de série mensal. `mes` é sempre "AAAA-MM". */
export type Ponto = { mes: string; valor: number | null };
export type Serie = Ponto[];

/** Unidades que o BCB publica e que o painel precisa reconciliar (spec §0). */
export type Unidade = "milhoes-brl" | "milhares-brl" | "percent-aa";

/**
 * Normaliza para **R$ milhões**, a unidade canônica do pipeline.
 *
 * Existe porque a família 27xxx (Meios de pagamento amplos) vem em R$ mil e a
 * família 28xxx (crédito e títulos de dívida) vem em R$ milhões. Somar as duas
 * sem passar por aqui produz erro de 1.000× que não aparece a olho nu.
 */
export function normalizar(serie: Serie, unidade: Unidade): Serie {
  if (unidade === "percent-aa") {
    throw new Error(
      "normalizar: série em % a.a. não é convertível para R$ milhões — não misture taxa com estoque",
    );
  }
  const fator = unidade === "milhares-brl" ? 1 / 1000 : 1;
  if (fator === 1) return serie.map((p) => ({ ...p }));
  return serie.map((p) => ({
    mes: p.mes,
    valor: p.valor === null ? null : p.valor * fator,
  }));
}

/** Valor escalar normalizado para R$ milhões. */
export function normalizarValor(valor: number | null, unidade: Unidade): number | null {
  if (valor === null) return null;
  if (unidade === "percent-aa") {
    throw new Error("normalizarValor: série em % a.a. não é convertível para R$ milhões");
  }
  return unidade === "milhares-brl" ? valor / 1000 : valor;
}

/** Variação vs. mês anterior, em fração. */
export function varMensal(serie: Serie): Serie {
  return deslocada(serie, 1);
}

/** Variação vs. mesmo mês do ano anterior, em fração. */
export function var12m(serie: Serie): Serie {
  return deslocada(serie, 12);
}

function deslocada(serie: Serie, lag: number): Serie {
  const porMes = new Map(serie.map((p) => [p.mes, p.valor]));
  return serie.map((p) => {
    const anterior = porMes.get(mesMenos(p.mes, lag));
    return { mes: p.mes, valor: razaoVar(p.valor, anterior) };
  });
}

function razaoVar(atual: number | null | undefined, base: number | null | undefined): number | null {
  if (atual === null || atual === undefined) return null;
  if (base === null || base === undefined) return null;
  // Divisão por zero não vira Infinity silencioso — vira lacuna declarada.
  if (base === 0) return null;
  return (atual - base) / base;
}

/** Participação de `x` no `total`, ponto a ponto, em fração. */
export function participacao(x: Serie, total: Serie): Serie {
  const porMes = new Map(total.map((p) => [p.mes, p.valor]));
  return x.map((p) => {
    const t = porMes.get(p.mes);
    if (p.valor === null || t === null || t === undefined || t === 0) {
      return { mes: p.mes, valor: null };
    }
    return { mes: p.mes, valor: p.valor / t };
  });
}

/** Soma ponto a ponto. Qualquer parcela nula torna o mês nulo. */
export function somar(...series: Serie[]): Serie {
  if (series.length === 0) return [];
  const meses = mesesComuns(series);
  const mapas = series.map((s) => new Map(s.map((p) => [p.mes, p.valor])));
  return meses.map((mes) => {
    let acc = 0;
    for (const m of mapas) {
      const v = m.get(mes);
      if (v === null || v === undefined) return { mes, valor: null };
      acc += v;
    }
    return { mes, valor: acc };
  });
}

/** Diferença ponto a ponto (`a − b`). */
export function subtrair(a: Serie, b: Serie): Serie {
  const mb = new Map(b.map((p) => [p.mes, p.valor]));
  return a.map((p) => {
    const v = mb.get(p.mes);
    if (p.valor === null || v === null || v === undefined) return { mes: p.mes, valor: null };
    return { mes: p.mes, valor: p.valor - v };
  });
}

/** Razão ponto a ponto (`a ÷ b`). */
export function razao(a: Serie, b: Serie): Serie {
  const mb = new Map(b.map((p) => [p.mes, p.valor]));
  return a.map((p) => {
    const v = mb.get(p.mes);
    if (p.valor === null || v === null || v === undefined || v === 0) {
      return { mes: p.mes, valor: null };
    }
    return { mes: p.mes, valor: p.valor / v };
  });
}

/* ------------------------------------------------------------------ *
 * Desintermediação — o núcleo analítico do painel (spec §6, v2)
 * ------------------------------------------------------------------ */

/**
 * Participação do mercado de capitais no financiamento às empresas.
 *
 * O denominador é a **soma dos dois canais domésticos** (28851 + 28848), não o
 * crédito ampliado. Esse é o perímetro declarado da tese; trocá-lo muda a
 * magnitude do fenômeno (52,0% → 35,4%) sem mudar a direção. O teste desta
 * função existe para falhar se o perímetro for trocado em silêncio.
 */
export function partMercCap(mercCap: Serie, credBancario: Serie): Serie {
  return participacao(mercCap, somar(mercCap, credBancario));
}

/** Variação da participação em 12 meses, em p.p. (fração). */
export function deltaPart12m(part: Serie): Serie {
  const porMes = new Map(part.map((p) => [p.mes, p.valor]));
  return part.map((p) => {
    const base = porMes.get(mesMenos(p.mes, 12));
    if (p.valor === null || base === null || base === undefined) {
      return { mes: p.mes, valor: null };
    }
    return { mes: p.mes, valor: p.valor - base };
  });
}

/** Participação sob o perímetro do crédito ampliado (validação cruzada). */
export function partAmpliado(mercCap: Serie, creditoAmpliado: Serie): Serie {
  return participacao(mercCap, creditoAmpliado);
}

/* ------------------------------------------------------------------ *
 * FIDC (spec §6)
 * ------------------------------------------------------------------ */

/** Inadimplência agregada do mês: Σ créditos vencidos ÷ Σ carteira. */
export function inadFIDC(vencidos: number, carteira: number): number | null {
  if (carteira === 0) return null;
  return vencidos / carteira;
}

/** Índice de subordinação: Σ PL subordinadas ÷ Σ PL total. */
export function subordinacao(plSubordinada: number, plTotal: number): number | null {
  if (plTotal === 0) return null;
  return plSubordinada / plTotal;
}

/* ------------------------------------------------------------------ *
 * Utilitários de série
 * ------------------------------------------------------------------ */

/** "2026-06" menos `n` meses. */
export function mesMenos(ym: string, n: number): string {
  const [a, m] = ym.split("-").map(Number);
  const total = a * 12 + (m - 1) - n;
  const ano = Math.floor(total / 12);
  const mes = (total % 12) + 1;
  return `${String(ano).padStart(4, "0")}-${String(mes).padStart(2, "0")}`;
}

/** Trunca a série à janela canônica do painel (spec: jan/2013 em diante). */
export function truncar(serie: Serie, inicio = "2013-01"): Serie {
  return serie.filter((p) => p.mes >= inicio);
}

/** Último ponto não nulo. */
export function ultimo(serie: Serie): Ponto | null {
  for (let i = serie.length - 1; i >= 0; i--) {
    if (serie[i].valor !== null) return serie[i];
  }
  return null;
}

/** Valor num mês específico (null se ausente). */
export function valorEm(serie: Serie, mes: string): number | null {
  return serie.find((p) => p.mes === mes)?.valor ?? null;
}

/** União ordenada dos meses de várias séries. */
function mesesComuns(series: Serie[]): string[] {
  const set = new Set<string>();
  for (const s of series) for (const p of s) set.add(p.mes);
  return [...set].sort();
}

/**
 * Primeiro mês em que `a` passa `b` — o ponto de cruzamento da tese.
 * Retorna null se o cruzamento não ocorre dentro da janela.
 */
export function cruzamento(a: Serie, b: Serie): string | null {
  const mb = new Map(b.map((p) => [p.mes, p.valor]));
  let anteriorAbaixo = false;
  for (const p of a) {
    const v = mb.get(p.mes);
    if (p.valor === null || v === null || v === undefined) continue;
    const acima = p.valor > v;
    if (acima && anteriorAbaixo) return p.mes;
    anteriorAbaixo = !acima;
  }
  return null;
}
