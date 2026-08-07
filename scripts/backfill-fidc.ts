/**
 * Carga **única** dos informes mensais de FIDC da CVM (spec §3.1 e §3.3).
 *
 * Histórico 2013–2024 em ZIPs anuais + 2025 em diante em ZIPs mensais.
 * Roda uma vez, localmente; o resultado é commitado. O cron semanal não
 * executa este script.
 *
 *   npm run backfill:fidc
 *
 * Duas armadilhas do formato da CVM, ambas tratadas aqui:
 *
 *  1. **Encoding latin-1.** Os CSVs não são UTF-8. Ler como UTF-8 corrompe
 *     todo acento e quebra o casamento de rótulos ("Sênior").
 *  2. **O schema mudou em 2025.** A Res. CVM 175 reorganizou o FIDC em
 *     fundo + classes: a chave passou de `CNPJ_FUNDO` para
 *     `CNPJ_FUNDO_CLASSE` e os rótulos de cota de "Classe Subordinada 1"
 *     para "Subclasse Subordinada Mezanino 1 | Série…". Por isso o parser é
 *     dirigido pelo cabeçalho, nunca por posição de coluna.
 */

import AdmZip from "adm-zip";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { FONTE_CVM_FIDC } from "@/data/sources";
import { zFidc } from "@/lib/schemas";
import { buscarComRetry } from "./lib/bcb";

const DEST = join(process.cwd(), "src", "data", "generated");
const ANOS_HISTORICOS = Array.from({ length: 12 }, (_, i) => String(2013 + i));

/** Classes de recebível publicadas na Tab II (nível A..K). */
const CLASSES_RECEBIVEL: Array<{ coluna: string; rotulo: string }> = [
  { coluna: "TAB_II_A_VL_INDUST", rotulo: "Industrial" },
  { coluna: "TAB_II_B_VL_IMOBIL", rotulo: "Imobiliário" },
  { coluna: "TAB_II_C_VL_COMERC", rotulo: "Comercial" },
  { coluna: "TAB_II_D_VL_SERV", rotulo: "Serviços" },
  { coluna: "TAB_II_E_VL_AGRONEG", rotulo: "Agronegócio" },
  { coluna: "TAB_II_F_VL_FINANC", rotulo: "Financeiro" },
  { coluna: "TAB_II_G_VL_CREDITO", rotulo: "Cartão de crédito" },
  { coluna: "TAB_II_H_VL_FACTOR", rotulo: "Factoring" },
  { coluna: "TAB_II_I_VL_SETOR_PUBLICO", rotulo: "Setor público" },
  { coluna: "TAB_II_J_VL_JUDICIAL", rotulo: "Precatórios e ações judiciais" },
  { coluna: "TAB_II_K_VL_MARCA", rotulo: "Marcas e patentes" },
];

type Tabela = { cab: string[]; linhas: string[][] };

function lerCsv(buf: Buffer): Tabela {
  // latin-1, não UTF-8 (ver cabeçalho do arquivo).
  const texto = new TextDecoder("latin1").decode(buf);
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim());
  return { cab: linhas[0].split(";"), linhas: linhas.slice(1).map((l) => l.split(";")) };
}

/** Índice de coluna pelo primeiro nome que existir; -1 se nenhum existir. */
function col(t: Tabela, ...nomes: string[]): number {
  for (const n of nomes) {
    const i = t.cab.indexOf(n);
    if (i !== -1) return i;
  }
  return -1;
}

const num = (linha: string[], i: number): number => {
  if (i < 0) return 0;
  const v = Number(linha[i]);
  return Number.isFinite(v) ? v : 0;
};

/** "2026-06-30" → "2026-06". */
const mesDe = (dt: string): string => (dt ?? "").slice(0, 7);

/** Cotas de um informe, antes da reconciliação. */
type Cotas = { senior: number; subordinada: number };

type Acumulado = {
  informes: Set<string>;
  plTotal: number;
  carteira: number;
  vencidos: number;
  classes: Map<string, number>;
  /** PL declarado por informe (Tab IV), para reconciliar com as cotas. */
  plPorInforme: Map<string, number>;
  /** Cotas por informe (Tab X_2). */
  cotasPorInforme: Map<string, Cotas>;
};

const novoAcumulado = (): Acumulado => ({
  informes: new Set(),
  plTotal: 0,
  carteira: 0,
  vencidos: 0,
  classes: new Map(),
  plPorInforme: new Map(),
  cotasPorInforme: new Map(),
});

/**
 * Tolerância da reconciliação cotas × PL declarado.
 * Acima disso o informe fica de fora do índice de subordinação.
 */
const TOLERANCIA_RECONCILIACAO = 0.05;

function processarZip(zip: AdmZip, acc: Map<string, Acumulado>) {
  /**
   * Todas as entradas que casam — os ZIPs anuais de 2019 em diante trazem um
   * CSV **por mês** de cada tabela, não um por ano. Ler só o primeiro daria
   * janeiro e descartaria onze doze avos do histórico.
   */
  const pegaTodas = (padrao: RegExp): Tabela[] =>
    zip
      .getEntries()
      .filter((x) => padrao.test(x.entryName))
      .map((x) => lerCsv(x.getData()));

  const doMes = (mes: string) => {
    if (!acc.has(mes)) acc.set(mes, novoAcumulado());
    return acc.get(mes)!;
  };

  // Tab IV — patrimônio líquido e contagem de informes.
  for (const tIV of pegaTodas(/tab_IV_/)) {
    const cCnpj = col(tIV, "CNPJ_FUNDO_CLASSE", "CNPJ_FUNDO");
    const cDt = col(tIV, "DT_COMPTC");
    const cPl = col(tIV, "TAB_IV_A_VL_PL");
    for (const l of tIV.linhas) {
      const mes = mesDe(l[cDt]);
      if (!mes) continue;
      const a = doMes(mes);
      const cnpj = l[cCnpj] ?? "";
      const pl = num(l, cPl);
      a.informes.add(cnpj);
      a.plTotal += pl;
      a.plPorInforme.set(cnpj, (a.plPorInforme.get(cnpj) ?? 0) + pl);
    }
  }

  // Tab I — carteira de direitos creditórios e créditos inadimplentes.
  for (const tI of pegaTodas(/tab_I_/)) {
    const cDt = col(tI, "DT_COMPTC");
    const cComRisco = col(tI, "TAB_I2A_VL_DIRCRED_RISCO");
    const cSemRisco = col(tI, "TAB_I2B_VL_DIRCRED_SEM_RISCO");
    // Vencidos e **não** pagos. I2A1/I2B1 são vencidos adimplentes e ficam fora.
    const cInadA = col(tI, "TAB_I2A2_VL_CRED_VENC_INAD");
    const cInadB = col(tI, "TAB_I2B2_VL_CRED_VENC_INAD");
    for (const l of tI.linhas) {
      const mes = mesDe(l[cDt]);
      if (!mes) continue;
      const a = doMes(mes);
      a.carteira += num(l, cComRisco) + num(l, cSemRisco);
      a.vencidos += num(l, cInadA) + num(l, cInadB);
    }
  }

  // Tab II — composição da carteira por classe de recebível.
  for (const tII of pegaTodas(/tab_II_/)) {
    const cDt = col(tII, "DT_COMPTC");
    const idx = CLASSES_RECEBIVEL.map((c) => [c.rotulo, col(tII, c.coluna)] as const);
    for (const l of tII.linhas) {
      const mes = mesDe(l[cDt]);
      if (!mes) continue;
      const a = doMes(mes);
      for (const [rotulo, i] of idx) {
        if (i < 0) continue;
        a.classes.set(rotulo, (a.classes.get(rotulo) ?? 0) + num(l, i));
      }
    }
  }

  // Tab X_2 — cotas por classe, insumo do índice de subordinação.
  for (const tX2 of pegaTodas(/tab_X_2_/)) {
    const cCnpj = col(tX2, "CNPJ_FUNDO_CLASSE", "CNPJ_FUNDO");
    const cDt = col(tX2, "DT_COMPTC");
    const cClasse = col(tX2, "TAB_X_CLASSE_SERIE");
    const cQt = col(tX2, "TAB_X_QT_COTA");
    const cVl = col(tX2, "TAB_X_VL_COTA");
    for (const l of tX2.linhas) {
      const mes = mesDe(l[cDt]);
      if (!mes) continue;
      const a = doMes(mes);
      const cnpj = l[cCnpj] ?? "";
      const valor = num(l, cQt) * num(l, cVl);
      const atual = a.cotasPorInforme.get(cnpj) ?? { senior: 0, subordinada: 0 };
      // "Subordinada" cobre mezanino, que é subordinada de prioridade
      // intermediária. Séries nomeadas apenas "Série N" são sênior.
      if (/subordinad/i.test(l[cClasse] ?? "")) atual.subordinada += valor;
      else atual.senior += valor;
      a.cotasPorInforme.set(cnpj, atual);
    }
  }
}

/**
 * Agrega senior × subordinada somente sobre informes cujas cotas batem com o
 * PL que o próprio fundo declarou.
 *
 * Sem esse filtro, uma linha com erro de digitação contamina o agregado
 * inteiro: em jan/2013 um informe reportou 26 cotas a R$ 103 bi cada e sozinho
 * respondia por 97% da soma. Preferimos declarar cobertura menor a publicar
 * um índice errado (spec §8, regra 12).
 */
function subordinacaoConciliada(a: Acumulado) {
  let senior = 0;
  let subordinada = 0;
  let plConciliado = 0;
  for (const [cnpj, cotas] of a.cotasPorInforme) {
    const pl = a.plPorInforme.get(cnpj);
    if (!pl || pl <= 0) continue;
    const total = cotas.senior + cotas.subordinada;
    if (Math.abs(total - pl) / pl > TOLERANCIA_RECONCILIACAO) continue;
    senior += cotas.senior;
    subordinada += cotas.subordinada;
    plConciliado += pl;
  }
  return {
    plSenior: senior,
    plSubordinada: subordinada,
    cobertura: a.plTotal > 0 ? Math.min(1, plConciliado / a.plTotal) : 0,
  };
}

/**
 * Encontra uma quebra de classificação na série de subordinação.
 *
 * O índice é estrutural: muda com emissão e amortização de cotas, alguns
 * pontos percentuais por ano. Um salto de mais de 15 p.p. em um único mês não
 * é mercado — é a origem trocando o rótulo das cotas. Marcamos e declaramos
 * em vez de emendar as duas metades como se fossem a mesma série.
 */
function detectarQuebra(meses: Array<{ mes: string; plSenior: number; plSubordinada: number }>) {
  const LIMIAR = 0.15;
  const taxa = (m: { plSenior: number; plSubordinada: number }) => {
    const t = m.plSenior + m.plSubordinada;
    return t > 0 ? m.plSubordinada / t : null;
  };
  let maior = { mes: null as string | null, salto: 0 };
  for (let i = 1; i < meses.length; i++) {
    const a = taxa(meses[i - 1]);
    const b = taxa(meses[i]);
    if (a === null || b === null) continue;
    const salto = Math.abs(b - a);
    if (salto > LIMIAR && salto > maior.salto) maior = { mes: meses[i].mes, salto };
  }
  return maior.mes;
}

async function baixarZip(url: string): Promise<AdmZip | null> {
  const r = await buscarComRetry(url);
  const buf = Buffer.from(await r.arrayBuffer());
  return new AdmZip(buf);
}

/** Descobre os ZIPs mensais publicados (2025 em diante). */
async function mesesCorrentes(): Promise<string[]> {
  const r = await buscarComRetry(
    "https://dados.cvm.gov.br/dados/FIDC/DOC/INF_MENSAL/DADOS/",
  );
  const html = await r.text();
  const achados = new Set<string>();
  for (const m of html.matchAll(/inf_mensal_fidc_(\d{6})\.zip/g)) achados.add(m[1]);
  return [...achados].sort();
}

async function main() {
  const acc = new Map<string, Acumulado>();

  console.log("→ histórico anual (2013–2024)");
  for (const ano of ANOS_HISTORICOS) {
    const zip = await baixarZip(FONTE_CVM_FIDC.historico(ano));
    if (!zip) throw new Error(`ano ${ano} indisponível`);
    processarZip(zip, acc);
    console.log(`  ✓ ${ano}`);
  }

  const meses = await mesesCorrentes();
  console.log(`→ informes mensais correntes (${meses.length} arquivos)`);
  for (const aaaamm of meses) {
    const zip = await baixarZip(FONTE_CVM_FIDC.corrente(aaaamm));
    if (!zip) throw new Error(`mês ${aaaamm} indisponível`);
    processarZip(zip, acc);
    console.log(`  ✓ ${aaaamm}`);
  }

  const ordenados = [...acc.entries()].sort(([a], [b]) => a.localeCompare(b));
  // R$ → R$ milhões, a unidade canônica do painel.
  const M = 1_000_000;
  const dadosMeses = ordenados.map(([mes, a]) => {
    const sub = subordinacaoConciliada(a);
    return {
      mes,
      fundos: a.informes.size,
      plTotal: a.plTotal / M,
      carteiraDireitosCreditorios: a.carteira / M,
      creditosVencidos: a.vencidos / M,
      plSenior: sub.plSenior / M,
      plSubordinada: sub.plSubordinada / M,
      cobertura: sub.cobertura,
    };
  });

  const coberturaMin = Math.min(...dadosMeses.map((m) => m.cobertura));
  console.log(
    `  · cobertura do índice de subordinação: mínima ${(coberturaMin * 100).toFixed(0)}%, ` +
      `última ${(dadosMeses.at(-1)!.cobertura * 100).toFixed(0)}% do PL`,
  );

  const ultimo = ordenados.at(-1)!;
  const classes = [...ultimo[1].classes.entries()]
    .map(([rotulo, valor]) => ({ rotulo, valor: valor / M }))
    .filter((c) => c.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  // A paleta categórica tem 8 slots e não se cicla (regra do skill dataviz):
  // as 7 maiores classes ficam nomeadas e o resto vira "Outras".
  const TOPO = 7;
  const topo = classes.slice(0, TOPO);
  const resto = classes.slice(TOPO);
  const classesUltimoMes = resto.length
    ? [...topo, { rotulo: "Outras classes", valor: resto.reduce((s, c) => s + c.valor, 0) }]
    : topo;
  if (resto.length) {
    console.log(
      `  · ${resto.length} classes menores agrupadas em "Outras classes": ${resto.map((r) => r.rotulo).join(", ")}`,
    );
  }

  const dados = zFidc.parse({
    meses: dadosMeses,
    classesUltimoMes,
    mesClasses: ultimo[0],
    quebraSubordinacao: detectarQuebra(dadosMeses),
  });
  if (dados.quebraSubordinacao) {
    console.log(
      `  ! quebra de série no índice de subordinação em ${dados.quebraSubordinacao} ` +
        `— salto incompatível com movimento de mercado, provável reclassificação de rótulos na origem`,
    );
  }

  await mkdir(DEST, { recursive: true });
  await writeFile(join(DEST, "fidc.json"), JSON.stringify(dados, null, 2) + "\n");

  const u = dados.meses.at(-1)!;
  console.log(
    `\n✓ ${dados.meses.length} meses (${dados.meses[0].mes} → ${u.mes})\n` +
      `  ${u.fundos} informes · PL R$ ${(u.plTotal / 1e6).toFixed(1)} tri · ` +
      `inadimplência ${((100 * u.creditosVencidos) / u.carteiraDireitosCreditorios).toFixed(2)}% · ` +
      `subordinação ${((100 * u.plSubordinada) / (u.plSenior + u.plSubordinada)).toFixed(1)}%`,
  );
}

main().catch((e) => {
  console.error("\n✗ backfill FIDC abortado:", e instanceof Error ? e.message : e);
  process.exit(1);
});
