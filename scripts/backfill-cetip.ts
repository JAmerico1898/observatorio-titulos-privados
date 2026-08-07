/**
 * Carga **única** do acervo congelado de balcão (spec §3.1 e §3.3).
 *
 * A B3 herdou o acervo da CETIP e o encerrou em 11/12/2025. Sobreviveram aqui
 * só `Estoque-LCI` e `Estoque-LCA`, porque são a única fonte pública gratuita
 * que separa LCI de LCA — o SGS publica as duas somadas em "Letras de crédito"
 * (27807). Debêntures, CRI e CRA não existem neste acervo.
 *
 * Roda uma vez, localmente. O resultado é commitado e o cron semanal nunca
 * executa este script.
 *
 *   npm run backfill:cetip
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { FONTE_CETIP } from "@/data/sources";
import { zCetip } from "@/lib/schemas";
import { buscarComRetry } from "./lib/bcb";

const DEST = join(process.cwd(), "src", "data", "generated");

/** Série diária: "dd/mm/aaaa" → valor em reais. */
type SerieDiaria = Map<string, number>;

async function baixar(fileName: string): Promise<SerieDiaria> {
  const pedido = await buscarComRetry(FONTE_CETIP.requestName(fileName));
  const { redirectUrl } = (await pedido.json()) as { redirectUrl?: string };
  if (!redirectUrl) throw new Error(`${fileName}: a B3 não devolveu redirectUrl`);

  // O "~" no redirectUrl é atalho para a base da API.
  const arquivo = await buscarComRetry(`${FONTE_CETIP.base}${redirectUrl.replace("~", "")}`);
  const texto = (await arquivo.text()).replace(/^﻿/, "");

  const linhas = texto.split(/\r?\n/).filter((l) => l.trim());
  const serie: SerieDiaria = new Map();
  for (const linha of linhas.slice(1)) {
    const [data, valor] = linha.split(";");
    if (!data || !valor) continue;
    // Formato brasileiro na origem: ponto de milhar, vírgula decimal.
    const n = Number(valor.trim().replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(n)) continue;
    serie.set(data.trim(), n);
  }
  if (serie.size === 0) throw new Error(`${fileName}: nenhuma linha aproveitável`);
  console.log(`  ✓ ${fileName}: ${serie.size} observações diárias`);
  return serie;
}

/** Último dia disponível de cada mês, em R$ milhões. */
function mensalizar(diaria: SerieDiaria): Map<string, number> {
  const porMes = new Map<string, { dia: string; valor: number }>();
  for (const [data, valor] of diaria) {
    const [d, m, a] = data.split("/");
    const mes = `${a}-${m}`;
    const atual = porMes.get(mes);
    if (!atual || d > atual.dia) porMes.set(mes, { dia: d, valor });
  }
  return new Map([...porMes].map(([mes, { valor }]) => [mes, valor / 1_000_000]));
}

async function main() {
  console.log("→ acervo congelado B3/CETIP (carga única)");
  const [lciD, lcaD] = await Promise.all([
    baixar(FONTE_CETIP.arquivos[0].fileName),
    baixar(FONTE_CETIP.arquivos[1].fileName),
  ]);

  const lci = mensalizar(lciD);
  const lca = mensalizar(lcaD);

  const meses = [...new Set([...lci.keys(), ...lca.keys()])].sort();
  const dados = zCetip.parse({
    dataCorte: FONTE_CETIP.dataCorte,
    meses: meses.map((mes) => ({
      mes,
      lci: lci.get(mes) ?? null,
      lca: lca.get(mes) ?? null,
    })),
  });

  await mkdir(DEST, { recursive: true });
  await writeFile(join(DEST, "cetip.json"), JSON.stringify(dados, null, 2) + "\n");

  const ultimo = dados.meses.at(-1)!;
  console.log(
    `\n✓ ${dados.meses.length} meses gravados (${dados.meses[0].mes} → ${ultimo.mes}).\n` +
      `  Último: LCI R$ ${(ultimo.lci! / 1000).toFixed(1)} bi · LCA R$ ${(ultimo.lca! / 1000).toFixed(1)} bi`,
  );
  console.log("  Lembrete: valores arredondados na origem (2–3 algarismos significativos).");
}

main().catch((e) => {
  console.error("\n✗ backfill CETIP abortado:", e instanceof Error ? e.message : e);
  process.exit(1);
});
