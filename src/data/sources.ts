/**
 * Registro único das séries (spec §3.2).
 *
 * Nenhum código SGS pode aparecer hardcoded fora deste arquivo — o eval
 * "Fontes rastreáveis" da §7.2 varre o repositório e falha se aparecer.
 *
 * Cada série carrega dois mecanismos de defesa independentes:
 *
 *  1. **Metadados** — o título e (quando o CKAN publica) a unidade são
 *     conferidos contra `dadosabertos.bcb.gov.br`. Pega renomeação e troca
 *     de unidade na origem.
 *  2. **Valor-âncora** — um valor conhecido em mês conhecido, conferido
 *     contra a API de dados. Pega a troca silenciosa do conteúdo de um código
 *     mesmo quando os metadados continuam idênticos.
 *
 * Um mecanismo sozinho não cobre o outro. É por isso que existem os dois.
 */

import type { Unidade } from "@/lib/transforms";

/**
 * Como a unidade desta série é verificada.
 *
 * `ckan`     — o CKAN publica "Unidade de medida" e o teste compara string a string.
 * `dominio`  — o CKAN **não** publica a unidade (é o caso das séries de ICC e
 *              Selic). O teste então (a) confirma que o campo continua ausente,
 *              para detectar se o BCB passar a publicá-lo divergindo do que
 *              declaramos, e (b) confere que os valores caem na faixa esperada
 *              de uma taxa em % a.a. Está declarado em Sobre como limitação.
 */
export type VerificacaoUnidade = "ckan" | "dominio";

export type SerieSGS = {
  /** Chave usada dentro do app. */
  chave: string;
  codigo: number;
  /** Título oficial, exatamente como o CKAN publica. */
  titulo: string;
  /** Rótulo curto para eixos, legendas e tabelas. */
  rotulo: string;
  unidade: Unidade;
  /** String exata de "Unidade de medida" no CKAN; `null` quando o CKAN omite. */
  unidadeCkan: string | null;
  verificacaoUnidade: VerificacaoUnidade;
  periodicidade: "mensal" | "diaria";
  inicio: string;
  /** Valor conhecido em mês conhecido (spec §3.2). */
  ancora: { mes: string; valor: number };
};

export const SGS_DADOS = (codigo: number) =>
  `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados?formato=json`;

export const CKAN_METADADOS = (codigo: number) =>
  `https://dadosabertos.bcb.gov.br/api/3/action/package_search?fq=codigo_sgs:${codigo}&rows=5`;

/** Tolerância do valor-âncora: o BCB revisa saldos retroativamente. */
export const TOLERANCIA_ANCORA = 0.02;

const MILHARES = "Milhares de unidades monetárias correntes";
const MILHOES = "Milhões de reais";

export const SERIES: SerieSGS[] = [
  /* ---- Captação bancária — família 27xxx, em R$ MIL (spec §0) ---- */
  {
    chave: "depositosPrazo",
    codigo: 27805,
    titulo: "Meios de pagamento amplos - Depósitos a prazo (saldo em final de período) - Novo",
    rotulo: "Depósitos a prazo (CDB/RDB)",
    unidade: "milhares-brl",
    unidadeCkan: MILHARES,
    verificacaoUnidade: "ckan",
    periodicidade: "mensal",
    inicio: "2001-12",
    ancora: { mes: "2020-01", valor: 1104047244 },
  },
  {
    chave: "letrasFinanceiras",
    codigo: 27806,
    titulo: "Meios de pagamento amplos - Letras financeiras (saldo em final de período) - Novo",
    rotulo: "Letras financeiras",
    unidade: "milhares-brl",
    unidadeCkan: MILHARES,
    verificacaoUnidade: "ckan",
    periodicidade: "mensal",
    inicio: "2001-12",
    ancora: { mes: "2020-01", valor: 349822093 },
  },
  {
    chave: "letrasCredito",
    codigo: 27807,
    titulo: "Meios de pagamento amplos - Letras de crédito (saldo em final de período) - Novo",
    rotulo: "Letras de crédito (LCI + LCA)",
    unidade: "milhares-brl",
    unidadeCkan: MILHARES,
    verificacaoUnidade: "ckan",
    periodicidade: "mensal",
    inicio: "2001-12",
    ancora: { mes: "2020-01", valor: 293001070 },
  },
  {
    chave: "outrosTitulosPrivados",
    codigo: 27808,
    titulo: "Meios de pagamento amplos - Outros títulos privados - (saldo em final de período) - Novo",
    rotulo: "Outros títulos privados",
    unidade: "milhares-brl",
    unidadeCkan: MILHARES,
    verificacaoUnidade: "ckan",
    periodicidade: "mensal",
    inicio: "2001-12",
    ancora: { mes: "2020-01", valor: 41298504 },
  },
  {
    chave: "captacaoBancariaTotal",
    codigo: 27809,
    titulo:
      "Meios de pagamento amplos - Títulos privados em poder do público (saldo em final de período) - Novo",
    rotulo: "Captação bancária total",
    unidade: "milhares-brl",
    unidadeCkan: MILHARES,
    verificacaoUnidade: "ckan",
    periodicidade: "mensal",
    inicio: "2001-12",
    ancora: { mes: "2020-01", valor: 1788168911 },
  },

  /* ---- Títulos de dívida (total da economia) — família 28xxx, R$ MILHÕES ---- */
  {
    chave: "titulosPublicos",
    codigo: 28189,
    titulo: "Saldo de títulos de dívida - títulos públicos",
    rotulo: "Títulos públicos",
    unidade: "milhoes-brl",
    unidadeCkan: MILHOES,
    verificacaoUnidade: "ckan",
    periodicidade: "mensal",
    inicio: "2013-01",
    ancora: { mes: "2020-01", valor: 3644966 },
  },
  {
    chave: "titulosPrivados",
    codigo: 28190,
    titulo: "Saldo de títulos de dívida - títulos privados",
    rotulo: "Títulos privados",
    unidade: "milhoes-brl",
    unidadeCkan: MILHOES,
    verificacaoUnidade: "ckan",
    periodicidade: "mensal",
    inicio: "2013-01",
    ancora: { mes: "2020-01", valor: 477968 },
  },
  {
    chave: "titulosSecuritizados",
    codigo: 28191,
    titulo: "Saldo de títulos de dívida - securitizados",
    rotulo: "Securitizados",
    unidade: "milhoes-brl",
    unidadeCkan: MILHOES,
    verificacaoUnidade: "ckan",
    periodicidade: "mensal",
    inicio: "2013-01",
    ancora: { mes: "2020-01", valor: 307598 },
  },

  /* ---- Crédito às empresas — o perímetro da tese (spec §1) ---- */
  {
    chave: "creditoAmpliadoEmpresas",
    codigo: 28846,
    titulo: "Saldo de crédito ampliado concedido a empresas - Total",
    rotulo: "Crédito ampliado a empresas",
    unidade: "milhoes-brl",
    unidadeCkan: MILHOES,
    verificacaoUnidade: "ckan",
    periodicidade: "mensal",
    inicio: "2013-01",
    ancora: { mes: "2020-01", valor: 3514719 },
  },
  {
    chave: "credBancarioEmpresas",
    codigo: 28848,
    titulo: "Saldo de empréstimos e financiamentos do SFN a empresas",
    rotulo: "Crédito bancário a empresas",
    unidade: "milhoes-brl",
    unidadeCkan: MILHOES,
    verificacaoUnidade: "ckan",
    periodicidade: "mensal",
    inicio: "2013-01",
    ancora: { mes: "2020-01", valor: 1261497 },
  },
  {
    chave: "mercCapEmpresas",
    codigo: 28851,
    titulo: "Saldo de títulos de dívida emitidos por empresas - Total",
    rotulo: "Mercado de capitais (empresas)",
    unidade: "milhoes-brl",
    unidadeCkan: MILHOES,
    verificacaoUnidade: "ckan",
    periodicidade: "mensal",
    inicio: "2013-01",
    ancora: { mes: "2020-01", valor: 745647 },
  },
  {
    chave: "mercCapPrivados",
    codigo: 28852,
    titulo: "Saldo de títulos de dívida emitidos por empresas - títulos privados",
    rotulo: "Debêntures e notas comerciais",
    unidade: "milhoes-brl",
    unidadeCkan: MILHOES,
    verificacaoUnidade: "ckan",
    periodicidade: "mensal",
    inicio: "2013-01",
    ancora: { mes: "2020-01", valor: 477968 },
  },

  /* ---- Custo do crédito (spec §4.6). O CKAN não publica unidade aqui. ---- */
  {
    chave: "iccTotal",
    codigo: 25351,
    titulo: "Indicador de Custo do Crédito - ICC",
    rotulo: "ICC total",
    unidade: "percent-aa",
    unidadeCkan: null,
    verificacaoUnidade: "dominio",
    periodicidade: "mensal",
    inicio: "2013-01",
    ancora: { mes: "2020-01", valor: 20.14 },
  },
  {
    chave: "iccPJ",
    codigo: 25352,
    titulo: "Indicador de Custo do Crédito - ICC - Pessoas jurídicas",
    rotulo: "ICC pessoas jurídicas",
    unidade: "percent-aa",
    unidadeCkan: null,
    verificacaoUnidade: "dominio",
    periodicidade: "mensal",
    inicio: "2013-01",
    ancora: { mes: "2020-01", valor: 13.75 },
  },
  {
    chave: "spreadICC",
    codigo: 27443,
    titulo: "Spread do ICC",
    rotulo: "Spread do ICC",
    unidade: "percent-aa",
    unidadeCkan: null,
    verificacaoUnidade: "dominio",
    periodicidade: "mensal",
    inicio: "2013-01",
    ancora: { mes: "2020-01", valor: 14.35 },
  },
  {
    /**
     * Taxa de referência do painel.
     *
     * A v2 da spec citava "CDI e Selic". O CDI (SGS 4389) **não tem registro no
     * CKAN** — não haveria como submetê-lo ao teste de metadados sem furar o
     * eval "Fontes rastreáveis = 100%". A Selic acumulada no mês anualizada
     * tem registro, é mensal como o resto do painel e mede a mesma coisa para
     * o propósito da 4.6. Substituição declarada em Sobre.
     */
    chave: "selicMensal",
    codigo: 4189,
    titulo: "Taxa de juros - Selic acumulada no mês anualizada base 252",
    rotulo: "Selic (a.a.)",
    unidade: "percent-aa",
    unidadeCkan: null,
    verificacaoUnidade: "dominio",
    periodicidade: "mensal",
    inicio: "1986-06",
    ancora: { mes: "2020-01", valor: 4.4 },
  },
];

export const porChave = (chave: string): SerieSGS => {
  const s = SERIES.find((x) => x.chave === chave);
  if (!s) throw new Error(`Série desconhecida: ${chave}`);
  return s;
};

/* ------------------------------------------------------------------ *
 * Fontes não-SGS
 * ------------------------------------------------------------------ */

export const FONTE_CVM_FIDC = {
  nome: "CVM — Informes mensais de FIDC",
  corrente: (aaaamm: string) =>
    `https://dados.cvm.gov.br/dados/FIDC/DOC/INF_MENSAL/DADOS/inf_mensal_fidc_${aaaamm}.zip`,
  historico: (aaaa: string) =>
    `https://dados.cvm.gov.br/dados/FIDC/DOC/INF_MENSAL/DADOS/HIST/inf_mensal_fidc_${aaaa}.zip`,
  portal: "https://dados.cvm.gov.br/dataset/fidc-doc-inf_mensal",
} as const;

/**
 * Acervo congelado de balcão, herdado da CETIP (spec §3.1).
 * Baixado **uma vez** por `scripts/backfill-cetip.ts` e commitado.
 * O pipeline semanal nunca toca aqui.
 */
export const FONTE_CETIP = {
  nome: "B3/CETIP — acervo histórico de renda fixa (UP2DATA)",
  dataCorte: "2025-12-11",
  requestName: (fileName: string) =>
    `https://arquivos.b3.com.br/api/download/requestname?fileName=${fileName}&date=9999-12-31`,
  base: "https://arquivos.b3.com.br/api",
  arquivos: [
    { fileName: "Estoque-LCI", rotulo: "LCI" },
    { fileName: "Estoque-LCA", rotulo: "LCA" },
  ],
} as const;
