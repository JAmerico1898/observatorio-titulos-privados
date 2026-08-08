/**
 * Acesso ao BCB. Código determinístico — sem LLM, sem heurística (spec §8, regra 5).
 */

import { SGS_DADOS, CKAN_METADADOS, type SerieSGS } from "@/data/sources";
import { zRespostaSGS } from "@/lib/schemas";
import type { Serie } from "@/lib/transforms";

/**
 * Busca com retry e recuo exponencial.
 *
 * Cinco tentativas, e não três, porque o SGS estrangula quando recebe muitas
 * requisições seguidas — o suficiente para derrubar uma execução inteira do
 * cron por um soluço passageiro da origem. Só 4xx (fora 429) falha na hora:
 * esse é erro nosso e não melhora com espera.
 */
export async function buscarComRetry(url: string, tentativas = 5): Promise<Response> {
  let ultimoErro: unknown;
  for (let i = 0; i < tentativas; i++) {
    try {
      const r = await fetch(url, {
        headers: { accept: "application/json", "user-agent": "observatorio-titulos-privados" },
      });
      if (r.ok) return r;
      // 4xx não melhora com retry — falhe alto na hora (spec §8, regra 12).
      if (r.status >= 400 && r.status < 500 && r.status !== 429) {
        throw new Error(`HTTP ${r.status} em ${url}`);
      }
      ultimoErro = new Error(`HTTP ${r.status} em ${url}`);
    } catch (e) {
      ultimoErro = e;
    }
    if (i < tentativas - 1) {
      await new Promise((res) => setTimeout(res, 1000 * 2 ** i));
    }
  }
  throw ultimoErro instanceof Error ? ultimoErro : new Error(String(ultimoErro));
}

/** Baixa uma série do SGS e devolve pontos mensais "AAAA-MM". */
export async function buscarSerieSGS(serie: SerieSGS): Promise<Serie> {
  const r = await buscarComRetry(SGS_DADOS(serie.codigo));
  const cru = zRespostaSGS.parse(await r.json());
  const porMes = new Map<string, number>();
  for (const { data, valor } of cru) {
    const [, m, a] = data.split("/");
    const num = Number(valor);
    if (!Number.isFinite(num)) continue;
    // A resposta vem em ordem cronológica; para série diária a última
    // gravação do mês vence, colapsando no dia mais recente disponível.
    porMes.set(`${a}-${m}`, num);
  }
  return [...porMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, valor]) => ({ mes, valor }));
}

export type MetadadosCkan = {
  encontrado: boolean;
  titulo: string | null;
  unidade: string | null;
  periodicidade: string | null;
};

/** Lê os metadados oficiais de uma série no CKAN de dados abertos do BCB. */
export async function buscarMetadadosCkan(codigo: number): Promise<MetadadosCkan> {
  const r = await buscarComRetry(CKAN_METADADOS(codigo));
  const j = (await r.json()) as {
    result?: { results?: Array<{ codigo_sgs?: string; title?: string; notes?: string }> };
  };
  const reg = (j.result?.results ?? []).find((x) => x.codigo_sgs === String(codigo));
  if (!reg) return { encontrado: false, titulo: null, unidade: null, periodicidade: null };
  const notes = reg.notes ?? "";
  return {
    encontrado: true,
    titulo: reg.title ?? null,
    unidade: notes.match(/Unidade de medida: __(.+?)__/)?.[1]?.trim() ?? null,
    periodicidade: notes.match(/Tipo da s[ée]rie: __(.+?)__/)?.[1]?.trim() ?? null,
  };
}
