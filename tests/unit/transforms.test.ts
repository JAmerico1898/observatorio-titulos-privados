import { describe, expect, it } from "vitest";

import {
  cruzamento,
  deltaPart12m,
  inadFIDC,
  mesMenos,
  normalizar,
  normalizarValor,
  partAmpliado,
  participacao,
  partMercCap,
  razao,
  somar,
  subordinacao,
  subtrair,
  truncar,
  ultimo,
  valorEm,
  var12m,
  varMensal,
  type Serie,
} from "@/lib/transforms";

/** Helper: série mensal contígua a partir de um mês inicial. */
const serieDe = (inicio: string, valores: Array<number | null>): Serie =>
  valores.map((valor, i) => ({ mes: somaMes(inicio, i), valor }));

function somaMes(ym: string, n: number): string {
  return mesMenos(ym, -n);
}

describe("normalizar — a defesa contra o erro de 1.000×", () => {
  it("converte R$ mil para R$ milhões", () => {
    // Importa porque a família 27xxx (captação) vem em R$ mil e a 28xxx
    // (crédito) em R$ milhões. Sem isso, a captação apareceria 1.000 vezes
    // maior que o crédito e nenhum gráfico denunciaria o erro.
    const s = serieDe("2020-01", [1_000_000, 2_500_000]);
    expect(normalizar(s, "milhares-brl")).toEqual([
      { mes: "2020-01", valor: 1000 },
      { mes: "2020-02", valor: 2500 },
    ]);
  });

  it("deixa R$ milhões intactos", () => {
    const s = serieDe("2020-01", [1234]);
    expect(normalizar(s, "milhoes-brl")).toEqual([{ mes: "2020-01", valor: 1234 }]);
  });

  it("preserva lacunas em vez de convertê-las em zero", () => {
    const s = serieDe("2020-01", [1_000_000, null]);
    expect(normalizar(s, "milhares-brl")[1].valor).toBeNull();
  });

  it("recusa converter taxa para moeda", () => {
    // Uma taxa em % a.a. não tem unidade monetária. Converter silenciosamente
    // produziria um número plausível e completamente sem sentido.
    expect(() => normalizar(serieDe("2020-01", [13.5]), "percent-aa")).toThrow(/% a\.a\./);
    expect(() => normalizarValor(13.5, "percent-aa")).toThrow();
  });
});

describe("varMensal e var12m", () => {
  it("calcula a variação contra o mês certo", () => {
    const s = serieDe("2020-01", [100, 110]);
    expect(valorEm(varMensal(s), "2020-02")).toBeCloseTo(0.1);
  });

  it("var12m usa o mesmo mês do ano anterior, não a 12ª posição do array", () => {
    // A distinção importa quando a série tem buracos: procurar por rótulo de
    // mês é correto, contar posições no array não é.
    const s: Serie = [
      { mes: "2020-01", valor: 100 },
      { mes: "2020-06", valor: 150 },
      { mes: "2021-01", valor: 130 },
    ];
    expect(valorEm(var12m(s), "2021-01")).toBeCloseTo(0.3);
  });

  it("propaga nulo quando falta a base, em vez de inventar zero", () => {
    const s = serieDe("2020-01", [null, 110]);
    expect(valorEm(varMensal(s), "2020-02")).toBeNull();
  });

  it("devolve nulo em divisão por zero, nunca Infinity", () => {
    // Infinity atravessaria o JSON como null ou quebraria o gráfico; um nulo
    // explícito interrompe a linha e o leitor vê a lacuna.
    const s = serieDe("2020-01", [0, 110]);
    expect(valorEm(varMensal(s), "2020-02")).toBeNull();
  });

  it("aceita série curta sem estourar", () => {
    expect(varMensal(serieDe("2020-01", [100]))).toEqual([{ mes: "2020-01", valor: null }]);
    expect(var12m([])).toEqual([]);
  });
});

describe("participacao", () => {
  it("divide ponto a ponto pelo total do mesmo mês", () => {
    const x = serieDe("2020-01", [25]);
    const total = serieDe("2020-01", [100]);
    expect(valorEm(participacao(x, total), "2020-01")).toBeCloseTo(0.25);
  });

  it("devolve nulo quando o total é zero", () => {
    expect(valorEm(participacao(serieDe("2020-01", [5]), serieDe("2020-01", [0])), "2020-01")).toBeNull();
  });
});

describe("somar e subtrair", () => {
  it("qualquer parcela nula torna o mês nulo", () => {
    // Somar tratando nulo como zero produziria um total menor que o real, sem
    // qualquer sinal de que faltava um pedaço.
    const a = serieDe("2020-01", [10, null]);
    const b = serieDe("2020-01", [5, 5]);
    expect(somar(a, b)).toEqual([
      { mes: "2020-01", valor: 15 },
      { mes: "2020-02", valor: null },
    ]);
  });

  it("subtrair respeita a mesma regra", () => {
    const a = serieDe("2020-01", [10]);
    const b = serieDe("2020-01", [null]);
    expect(valorEm(subtrair(a, b), "2020-01")).toBeNull();
  });

  it("somar sem argumentos devolve série vazia", () => {
    expect(somar()).toEqual([]);
  });

  it("razao devolve nulo quando o denominador é zero", () => {
    expect(valorEm(razao(serieDe("2020-01", [1]), serieDe("2020-01", [0])), "2020-01")).toBeNull();
  });
});

describe("partMercCap — o perímetro da tese", () => {
  it("usa a soma dos dois canais domésticos como denominador", () => {
    // Este teste existe para falhar se alguém trocar o perímetro em silêncio.
    // Com 60 de mercado e 40 de banco, a participação é 60% — e NÃO 150%,
    // que é o que sairia se o denominador virasse só o crédito bancário.
    const merc = serieDe("2026-06", [60]);
    const banco = serieDe("2026-06", [40]);
    expect(valorEm(partMercCap(merc, banco), "2026-06")).toBeCloseTo(0.6);
  });

  it("reproduz o número publicado pelo painel em junho de 2026", () => {
    // Valores oficiais em R$ milhões (SGS 28851 e 28848). Se a fórmula ou o
    // perímetro mudarem, este número deixa de bater com o que o painel anuncia.
    const merc = serieDe("2026-06", [2_556_166]);
    const banco = serieDe("2026-06", [2_361_207]);
    const p = valorEm(partMercCap(merc, banco), "2026-06")!;
    expect((p * 100).toFixed(1)).toBe("52.0");
  });

  it("partAmpliado usa o crédito ampliado como denominador e dá menos", () => {
    // O perímetro mais largo tem de produzir participação menor para o mesmo
    // numerador — é exatamente essa diferença que a página-tese discute.
    const merc = serieDe("2026-06", [2_556_166]);
    const banco = serieDe("2026-06", [2_361_207]);
    const ampliado = serieDe("2026-06", [7_214_949]);
    const doisCanais = valorEm(partMercCap(merc, banco), "2026-06")!;
    const amplo = valorEm(partAmpliado(merc, ampliado), "2026-06")!;
    expect((amplo * 100).toFixed(1)).toBe("35.4");
    expect(amplo).toBeLessThan(doisCanais);
  });
});

describe("deltaPart12m", () => {
  it("devolve diferença em pontos percentuais, não variação relativa", () => {
    // De 50% para 52% a diferença é 2 p.p. (0,02), não 4% (0,04). Trocar as
    // duas leituras é o erro mais comum ao ler participação.
    const part: Serie = [
      { mes: "2025-06", valor: 0.5 },
      { mes: "2026-06", valor: 0.52 },
    ];
    expect(valorEm(deltaPart12m(part), "2026-06")).toBeCloseTo(0.02);
  });
});

describe("cruzamento", () => {
  it("acha o primeiro mês em que a primeira série passa a segunda", () => {
    const a = serieDe("2020-01", [1, 2, 5]);
    const b = serieDe("2020-01", [3, 3, 3]);
    expect(cruzamento(a, b)).toBe("2020-03");
  });

  it("devolve nulo quando o cruzamento não ocorre na janela", () => {
    expect(cruzamento(serieDe("2020-01", [1, 2]), serieDe("2020-01", [9, 9]))).toBeNull();
  });

  it("ignora meses sem dado dos dois lados", () => {
    const a = serieDe("2020-01", [1, null, 5]);
    const b = serieDe("2020-01", [3, 3, 3]);
    expect(cruzamento(a, b)).toBe("2020-03");
  });
});

describe("indicadores de FIDC", () => {
  it("inadFIDC é vencidos sobre carteira", () => {
    expect(inadFIDC(5, 100)).toBeCloseTo(0.05);
  });

  it("subordinacao é PL subordinado sobre PL total", () => {
    expect(subordinacao(30, 100)).toBeCloseTo(0.3);
  });

  it("ambos devolvem nulo com denominador zero", () => {
    // Um fundo pode reportar carteira zerada; dividir daria NaN e o NaN
    // atravessaria até virar "—" ou, pior, um gráfico vazio sem explicação.
    expect(inadFIDC(5, 0)).toBeNull();
    expect(subordinacao(5, 0)).toBeNull();
  });
});

describe("utilitários de série", () => {
  it("mesMenos atravessa a virada de ano", () => {
    expect(mesMenos("2026-01", 1)).toBe("2025-12");
    expect(mesMenos("2026-06", 12)).toBe("2025-06");
    expect(mesMenos("2026-01", 13)).toBe("2024-12");
  });

  it("truncar aplica a janela canônica do painel", () => {
    // A janela começa em 2013 porque é onde começam o crédito ampliado e os
    // informes de FIDC — antes disso não há com o que comparar.
    const s = serieDe("2012-11", [1, 2, 3, 4]);
    expect(truncar(s).map((p) => p.mes)).toEqual(["2013-01", "2013-02"]);
  });

  it("ultimo ignora nulos no fim da série", () => {
    // Publicação defasada deixa nulos no fim; pegar o último elemento cru
    // faria o KPI mostrar "—" mesmo havendo dado.
    const s = serieDe("2020-01", [10, 20, null]);
    expect(ultimo(s)).toEqual({ mes: "2020-02", valor: 20 });
    expect(ultimo(serieDe("2020-01", [null]))).toBeNull();
  });

  it("valorEm devolve nulo para mês ausente", () => {
    expect(valorEm(serieDe("2020-01", [10]), "1999-01")).toBeNull();
  });
});
