/**
 * Camada de leitura dos JSONs gerados. Roda **no build** (spec §3.3):
 * as páginas são estáticas e o navegador do aluno nunca chama uma API.
 */

import sgsJson from "@/data/generated/sgs.json";
import metaJson from "@/data/generated/meta.json";
import cetipJson from "@/data/generated/cetip.json";
import fidcJson from "@/data/generated/fidc.json";
import {
  zSgsBundle,
  zMeta,
  zCetip,
  zFidc,
  type Cetip,
  type Fidc,
  type Meta,
  type SerieNomeada,
} from "@/lib/schemas";
import type { Serie } from "@/lib/transforms";
import { porChave } from "@/data/sources";

// Validar aqui e não só no pipeline: se um JSON commitado for corrompido, o
// build quebra em vez de publicar um painel com número errado.
const bundle = zSgsBundle.parse(sgsJson);
export const meta: Meta = zMeta.parse(metaJson);

/** Acervo congelado B3/CETIP — LCI e LCA (spec §3.1). */
export const cetip: Cetip = zCetip.parse(cetipJson);

/** Informes mensais de FIDC da CVM. */
export const fidc: Fidc = zFidc.parse(fidcJson);

const porChaveSerie = new Map<string, SerieNomeada>(bundle.series.map((s) => [s.chave, s]));

export function serieNomeada(chave: string): SerieNomeada {
  const s = porChaveSerie.get(chave);
  if (!s) throw new Error(`Série ausente em sgs.json: ${chave}. Rode npm run fetch-data.`);
  return s;
}

/** Pontos da série, já normalizados para R$ milhões (ou % a.a. se for taxa). */
export function serie(chave: string): Serie {
  return serieNomeada(chave).pontos;
}

/** Eyebrow de procedência: "SGS 28851 · BCB". */
export function fonteDe(chave: string): string {
  return `SGS ${porChave(chave).codigo} · BCB`;
}

/** Eyebrow para blocos que combinam várias séries. */
export function fonteDeVarias(...chaves: string[]): string {
  return `SGS ${chaves.map((c) => porChave(c).codigo).join(", ")} · BCB`;
}

export function rotuloDe(chave: string): string {
  return porChave(chave).rotulo;
}

/**
 * Junta séries num array de linhas para o Recharts e para o `DataTable`.
 * A união dos meses preserva as lacunas — mês ausente vira `null`, não zero.
 */
export type LinhaCombinada = { mes: string } & Record<string, number | null | string>;

export function combinar(entradas: Record<string, Serie>): LinhaCombinada[] {
  const meses = new Set<string>();
  for (const s of Object.values(entradas)) for (const p of s) meses.add(p.mes);
  const mapas = Object.entries(entradas).map(
    ([k, s]) => [k, new Map(s.map((p) => [p.mes, p.valor]))] as const,
  );
  return [...meses].sort().map((mes) => {
    const linha: LinhaCombinada = { mes };
    for (const [k, m] of mapas) linha[k] = m.get(mes) ?? null;
    return linha;
  });
}
