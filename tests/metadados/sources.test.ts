import { describe, expect, it } from "vitest";

import { SERIES, TOLERANCIA_ANCORA, type SerieSGS } from "@/data/sources";
import { buscarMetadadosCkan, buscarSerieSGS } from "../../scripts/lib/bcb";
import { truncar, valorEm, type Serie } from "@/lib/transforms";

/**
 * Cada série é baixada **uma vez** por execução, não uma vez por asserção.
 *
 * Sem isto, 16 séries × 4 testes que precisam do dado viravam ~80 requisições
 * ao BCB em paralelo, e a origem passava a responder devagar ou recusar — o
 * teste falhava por excesso de zelo, não por problema real na fonte.
 */
const cacheSerie = new Map<number, Promise<Serie>>();
const serieDe = (s: SerieSGS) => {
  if (!cacheSerie.has(s.codigo)) cacheSerie.set(s.codigo, buscarSerieSGS(s));
  return cacheSerie.get(s.codigo)!;
};

const cacheMeta = new Map<number, ReturnType<typeof buscarMetadadosCkan>>();
const metaDe = (codigo: number) => {
  if (!cacheMeta.has(codigo)) cacheMeta.set(codigo, buscarMetadadosCkan(codigo));
  return cacheMeta.get(codigo)!;
};

/**
 * Teste de metadados e valor-âncora (spec §3.2).
 *
 * Consulta o BCB **ao vivo**. Não é um teste de unidade disfarçado: ele existe
 * para quebrar o CI no dia em que a origem renomear uma série, trocar a
 * unidade de medida ou repovoar um código com outro conteúdo — três coisas que
 * nenhum teste offline detecta, e todas capazes de publicar um painel com o
 * número errado sem nenhum sintoma visível.
 */

describe("registro de séries", () => {
  it("não tem código nem chave repetidos", () => {
    expect(new Set(SERIES.map((s) => s.codigo)).size).toBe(SERIES.length);
    expect(new Set(SERIES.map((s) => s.chave)).size).toBe(SERIES.length);
  });

  it("declara unidade e método de verificação para toda série", () => {
    for (const s of SERIES) {
      expect(s.unidade, `série ${s.codigo}`).toBeTruthy();
      // Quem verifica por CKAN precisa da string esperada; quem verifica por
      // domínio precisa declarar que o CKAN não publica unidade.
      if (s.verificacaoUnidade === "ckan") expect(s.unidadeCkan, `série ${s.codigo}`).toBeTruthy();
      else expect(s.unidadeCkan, `série ${s.codigo}`).toBeNull();
    }
  });
});

describe.each(SERIES.map((s) => [s.codigo, s.rotulo, s] as const))(
  "SGS %i — %s",
  (_codigo, _rotulo, serie) => {
    it("continua registrada no portal de dados abertos com o mesmo título", async () => {
      const meta = await metaDe(serie.codigo);
      expect(meta.encontrado, `série ${serie.codigo} sumiu do CKAN`).toBe(true);
      expect(meta.titulo).toBe(serie.titulo);
    });

    it("mantém a unidade de medida que o pipeline assume", async () => {
      const meta = await metaDe(serie.codigo);
      if (serie.verificacaoUnidade === "ckan") {
        expect(meta.unidade).toBe(serie.unidadeCkan);
      } else {
        // O CKAN não publica unidade para ICC, spread e Selic. Se passar a
        // publicar, queremos saber: pode contradizer o que declaramos.
        expect(
          meta.unidade,
          `o CKAN passou a publicar unidade para ${serie.codigo}; reveja sources.ts`,
        ).toBeNull();
      }
    });

    it("bate com o valor-âncora, provando que o código não trocou de conteúdo", async () => {
      const pontos = await serieDe(serie);
      const valor = valorEm(pontos, serie.ancora.mes);
      expect(valor, `mês-âncora ${serie.ancora.mes} ausente`).not.toBeNull();
      // Tolerância porque o BCB revisa saldos retroativamente; larga o
      // suficiente para revisão, apertada o suficiente para pegar troca de série.
      const desvio = Math.abs(valor! - serie.ancora.valor) / Math.abs(serie.ancora.valor);
      expect(desvio).toBeLessThanOrEqual(TOLERANCIA_ANCORA);
    });

    it("é mensal e alcança a janela canônica do painel", async () => {
      const pontos = await serieDe(serie);
      expect(pontos.length).toBeGreaterThan(0);
      for (const p of pontos) expect(p.mes).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
      expect(pontos.at(-1)!.mes >= "2026-01").toBe(true);
    });

    it("tem valores no domínio esperado da unidade declarada", async () => {
      // Só a janela canônica do painel. Fora dela o domínio é outro: a Selic
      // anualizada passa de 250% na hiperinflação dos anos 1980, e nenhuma
      // dessas observações chega a ser publicada aqui.
      const pontos = truncar(await serieDe(serie));
      const valores = pontos.map((p) => p.valor).filter((v): v is number => v !== null);
      expect(valores.length).toBeGreaterThan(0);
      if (serie.unidade === "percent-aa") {
        // É a única checagem de unidade possível para as séries que o CKAN não
        // documenta: uma taxa em % a.a. do crédito brasileiro cabe em (0, 100).
        for (const v of valores) {
          expect(v).toBeGreaterThan(0);
          expect(v).toBeLessThan(100);
        }
      } else {
        // Zero é legítimo: letras financeiras e LCI valiam zero antes de o
        // instrumento existir. Negativo é que não seria — é saldo, não fluxo.
        for (const v of valores) expect(v).toBeGreaterThanOrEqual(0);
      }
    });
  },
);
