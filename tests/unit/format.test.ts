import { describe, expect, it } from "vitest";

import {
  aplicarFormato,
  formatBRL,
  formatBRLEixo,
  formatData,
  formatInteiro,
  formatMes,
  formatMesCurto,
  formatPP,
  formatPct,
  formatTaxa,
  formatVar,
} from "@/lib/format";

describe("formatBRL — a entrada é sempre R$ milhões", () => {
  it("escala para mil, milhão, bilhão e trilhão", () => {
    expect(formatBRL(0.5)).toBe("R$ 500 mil");
    expect(formatBRL(1)).toBe("R$ 1,0 mi");
    expect(formatBRL(1_500)).toBe("R$ 1,5 bi");
    expect(formatBRL(2_556_166)).toBe("R$ 2,6 tri");
  });

  it("usa vírgula decimal, como se escreve em português", () => {
    expect(formatBRL(1_234)).toBe("R$ 1,2 bi");
  });

  it("marca negativo com sinal de menos tipográfico", () => {
    expect(formatBRL(-1_500)).toBe("−R$ 1,5 bi");
  });

  it("zero não vira “0 mil”", () => {
    // O eixo de um gráfico que começa em zero imprimia "R$ 0 mil", que lê
    // como um valor pequeno em vez de nenhum valor.
    expect(formatBRL(0)).toBe("R$ 0");
  });

  it("nulo, indefinido e não-finito viram travessão", () => {
    expect(formatBRL(null)).toBe("—");
    expect(formatBRL(undefined)).toBe("—");
    expect(formatBRL(Number.NaN)).toBe("—");
    expect(formatBRL(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("formatBRLEixo", () => {
  it("mantém uma casa para não colapsar marcas distintas do eixo", () => {
    // Com zero casas, 1,3 tri e 1,5 tri imprimiam ambos "2 tri" e o eixo
    // passava a mentir sobre o espaçamento entre as marcas.
    expect(formatBRLEixo(1_300_000)).toBe("R$ 1,3 tri");
    expect(formatBRLEixo(1_500_000)).toBe("R$ 1,5 tri");
  });

  it("remove a casa decimal quando ela não acrescenta nada", () => {
    expect(formatBRLEixo(2_000_000)).toBe("R$ 2 tri");
    expect(formatBRLEixo(0)).toBe("R$ 0");
  });
});

describe("percentuais e pontos percentuais", () => {
  it("formatPct recebe fração e imprime percentual", () => {
    expect(formatPct(0.52)).toBe("52,0%");
    expect(formatPct(0.0311, 2)).toBe("3,11%");
  });

  it("formatPP sempre mostra o sinal e a unidade p.p.", () => {
    // p.p. e % medem coisas diferentes; a marcação explícita evita que o
    // leitor tome 2 p.p. por 2%.
    expect(formatPP(0.016)).toBe("+1,6 p.p.");
    expect(formatPP(-0.016)).toBe("−1,6 p.p.");
    expect(formatPP(0)).toBe("0,0 p.p.");
  });

  it("formatVar mostra o sinal da variação relativa", () => {
    expect(formatVar(0.013)).toBe("+1,3%");
    expect(formatVar(-0.013)).toBe("−1,3%");
  });

  it("formatTaxa marca a base anual", () => {
    expect(formatTaxa(17.6)).toBe("17,6% a.a.");
  });

  it("todos devolvem travessão para nulo", () => {
    expect(formatPct(null)).toBe("—");
    expect(formatPP(null)).toBe("—");
    expect(formatVar(null)).toBe("—");
    expect(formatTaxa(null)).toBe("—");
    expect(formatInteiro(null)).toBe("—");
  });
});

describe("datas e meses", () => {
  it("formatMes escreve o mês por extenso", () => {
    expect(formatMes("2026-06")).toBe("junho de 2026");
    expect(formatMes("2026-03")).toBe("março de 2026");
  });

  it("formatMesCurto serve ao eixo", () => {
    expect(formatMesCurto("2026-06")).toBe("jun/26");
  });

  it("formatData usa o formato brasileiro", () => {
    expect(formatData("2025-12-11")).toBe("11/12/2025");
  });

  it("entrada inválida volta como veio, sem inventar mês", () => {
    expect(formatMes("2026-13")).toBe("2026-13");
    expect(formatMes(null)).toBe("—");
    expect(formatData(null)).toBe("—");
    expect(formatMesCurto(null)).toBe("");
  });
});

describe("formatInteiro", () => {
  it("agrupa milhares no padrão brasileiro", () => {
    expect(formatInteiro(4311)).toBe("4.311");
  });
});

describe("aplicarFormato — a ponte servidor→cliente", () => {
  it("resolve cada token para o formatador correspondente", () => {
    // Os gráficos são componentes de cliente e recebem colunas de componentes
    // de servidor; uma função não atravessa essa fronteira, um token atravessa.
    expect(aplicarFormato("brl", 1_500)).toBe("R$ 1,5 bi");
    expect(aplicarFormato("brlEixo", 2_000_000)).toBe("R$ 2 tri");
    expect(aplicarFormato("pct", 0.52)).toBe("52,0%");
    expect(aplicarFormato("pct0", 0.52)).toBe("52%");
    expect(aplicarFormato("var", 0.013)).toBe("+1,3%");
    expect(aplicarFormato("var0", 0.013)).toBe("+1%");
    expect(aplicarFormato("pp", 0.016)).toBe("+1,6 p.p.");
    expect(aplicarFormato("taxa", 17.6)).toBe("17,6% a.a.");
    expect(aplicarFormato("inteiro", 4311)).toBe("4.311");
  });
});
