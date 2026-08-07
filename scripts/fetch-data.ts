/**
 * Pipeline semanal (spec §3.3).
 *
 * Baixa as séries do SGS, valida schema e metadados, normaliza para R$ milhões
 * e grava `src/data/generated/sgs.json` + `meta.json`.
 *
 * Falha de qualquer fonte **aborta** — nunca grava dados parciais.
 * Os backfills (CVM e CETIP) não rodam aqui; são cargas únicas commitadas.
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

import { SERIES, SGS_DADOS, TOLERANCIA_ANCORA } from "@/data/sources";
import { zSgsBundle, zMeta, type SerieNomeada } from "@/lib/schemas";
import { normalizar, valorEm, ultimo, truncar } from "@/lib/transforms";
import { buscarSerieSGS, buscarMetadadosCkan } from "./lib/bcb";

const DEST = join(process.cwd(), "src", "data", "generated");

async function main() {
  console.log(`→ ${SERIES.length} séries registradas em sources.ts`);
  const saida: SerieNomeada[] = [];
  const problemas: string[] = [];

  for (const serie of SERIES) {
    const meta = await buscarMetadadosCkan(serie.codigo);

    if (!meta.encontrado) {
      problemas.push(`${serie.codigo}: sem registro no CKAN`);
      continue;
    }
    if (meta.titulo !== serie.titulo) {
      problemas.push(
        `${serie.codigo}: título divergente\n    CKAN:      ${meta.titulo}\n    sources.ts: ${serie.titulo}`,
      );
    }
    if (serie.verificacaoUnidade === "ckan" && meta.unidade !== serie.unidadeCkan) {
      problemas.push(
        `${serie.codigo}: unidade divergente — CKAN "${meta.unidade}", sources.ts "${serie.unidadeCkan}"`,
      );
    }
    if (serie.verificacaoUnidade === "dominio" && meta.unidade !== null) {
      problemas.push(
        `${serie.codigo}: o CKAN passou a publicar unidade ("${meta.unidade}"). ` +
          `Reveja sources.ts e troque verificacaoUnidade para "ckan".`,
      );
    }

    const bruta = await buscarSerieSGS(serie);

    // Valor-âncora: pega troca silenciosa de conteúdo sob o mesmo código.
    const ancora = valorEm(bruta, serie.ancora.mes);
    if (ancora === null) {
      problemas.push(`${serie.codigo}: mês-âncora ${serie.ancora.mes} ausente na série`);
    } else {
      const desvio = Math.abs(ancora - serie.ancora.valor) / Math.abs(serie.ancora.valor);
      if (desvio > TOLERANCIA_ANCORA) {
        problemas.push(
          `${serie.codigo}: âncora ${serie.ancora.mes} esperava ${serie.ancora.valor}, veio ${ancora} (desvio ${(desvio * 100).toFixed(2)}%)`,
        );
      }
    }

    // Normalização para a unidade canônica antes de qualquer agregação.
    const pontos =
      serie.unidade === "percent-aa" ? bruta : normalizar(bruta, serie.unidade);

    saida.push({
      chave: serie.chave,
      codigo: serie.codigo,
      titulo: serie.titulo,
      rotulo: serie.rotulo,
      unidade: serie.unidade === "percent-aa" ? "percent-aa" : "milhoes-brl",
      pontos: truncar(pontos),
    });
    console.log(`  ✓ ${serie.codigo} ${serie.rotulo}`);
  }

  if (problemas.length) {
    console.error(`\n✗ ${problemas.length} problema(s) — nada foi gravado:\n`);
    for (const p of problemas) console.error(`  • ${p}`);
    process.exit(1);
  }

  const bundle = zSgsBundle.parse({ series: saida });

  // Mês de referência = o mais recente **comum** às séries centrais da tese.
  // Usar o máximo global publicaria um KPI de um mês e outro de outro.
  const centrais = ["mercCapEmpresas", "credBancarioEmpresas", "creditoAmpliadoEmpresas"];
  const mesReferencia = centrais
    .map((c) => ultimo(bundle.series.find((s) => s.chave === c)!.pontos)?.mes ?? "")
    .sort()[0];
  if (!mesReferencia) throw new Error("não foi possível determinar o mês de referência");

  const meta = zMeta.parse({
    processadoEm: new Date().toISOString(),
    mesReferencia,
    fontes: [
      {
        nome: "BCB — SGS",
        ultimoPeriodo: mesReferencia,
        url: SGS_DADOS(28851),
      },
      ...(await periodosDosBackfills()),
    ],
  });

  await mkdir(DEST, { recursive: true });
  await writeFile(join(DEST, "sgs.json"), JSON.stringify(bundle, null, 2) + "\n");
  await writeFile(join(DEST, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
  console.log(`\n✓ ${saida.length} séries gravadas. Mês de referência: ${mesReferencia}`);
}

/** Lê os JSONs congelados só para registrar o período deles no meta.json. */
async function periodosDosBackfills() {
  const fontes: Array<{ nome: string; ultimoPeriodo: string; url: string }> = [];
  try {
    const fidc = JSON.parse(await readFile(join(DEST, "fidc.json"), "utf8"));
    fontes.push({
      nome: "CVM — Informes mensais de FIDC",
      ultimoPeriodo: fidc.meses.at(-1)?.mes ?? "—",
      url: "https://dados.cvm.gov.br/dataset/fidc-doc-inf_mensal",
    });
  } catch {
    console.warn("  ! fidc.json ainda não existe (rode npm run backfill:fidc)");
  }
  try {
    const cetip = JSON.parse(await readFile(join(DEST, "cetip.json"), "utf8"));
    fontes.push({
      nome: "B3/CETIP — acervo congelado (LCI e LCA)",
      ultimoPeriodo: cetip.dataCorte,
      url: "https://arquivos.b3.com.br",
    });
  } catch {
    console.warn("  ! cetip.json ainda não existe (rode npm run backfill:cetip)");
  }
  return fontes;
}

main().catch((e) => {
  console.error("\n✗ pipeline abortado:", e instanceof Error ? e.message : e);
  process.exit(1);
});
