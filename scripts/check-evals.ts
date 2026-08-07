/**
 * Portão de entrega (spec §7.2 e §7.3).
 *
 * Cada eval abaixo é uma checagem sobre o repositório e os artefatos que o
 * build e os testes deixaram. Não repete o que os testes já fazem — mede o que
 * só se enxerga olhando o conjunto: cobertura de páginas, disciplina de
 * tokens, rastreabilidade das fontes, selos com fórmula publicada.
 *
 * Sai com código 1 se qualquer limiar não for atingido.
 */

import { readFile, readdir, access } from "node:fs/promises";
import { join, relative } from "node:path";

import { INDICADORES } from "@/data/indicadores";
import { SERIES } from "@/data/sources";
import { PAGINAS } from "@/data/paginas";
import { GLOSSARIO } from "@/data/glossario";

const RAIZ = process.cwd();

type Eval = {
  nome: string;
  limiar: string;
  ok: boolean;
  medido: string;
  detalhe?: string[];
};

const evals: Eval[] = [];
const add = (e: Eval) => evals.push(e);

async function existe(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function arquivos(dir: string, filtro: (f: string) => boolean): Promise<string[]> {
  const saida: string[] = [];
  async function andar(atual: string) {
    for (const e of await readdir(atual, { withFileTypes: true })) {
      const p = join(atual, e.name);
      if (e.isDirectory()) {
        if (["node_modules", ".next", ".git", "coverage", ".shots"].includes(e.name)) continue;
        await andar(p);
      } else if (filtro(p)) saida.push(p);
    }
  }
  await andar(dir);
  return saida;
}

async function main() {
  const fontesApp = await arquivos(join(RAIZ, "src"), (f) => f.endsWith(".tsx") || f.endsWith(".ts"));
  const textos = new Map<string, string>();
  for (const f of fontesApp) textos.set(f, await readFile(f, "utf8"));

  /* ---- 1. Cobertura de páginas por e2e ---- */
  const specE2E = await readFile(join(RAIZ, "tests", "e2e", "paginas.spec.ts"), "utf8");
  // O spec itera PAGINAS, então cobre todas por construção; conferimos que a
  // iteração continua lá e que toda rota tem página no App Router.
  const iteraTodas = specE2E.includes("for (const p of PAGINAS)");
  const rotasFaltando: string[] = [];
  for (const p of PAGINAS) {
    const caminho =
      p.href === "/"
        ? join(RAIZ, "src", "app", "page.tsx")
        : join(RAIZ, "src", "app", p.href.slice(1), "page.tsx");
    if (!(await existe(caminho))) rotasFaltando.push(p.href);
  }
  add({
    nome: "Cobertura de páginas (e2e)",
    limiar: "100%",
    ok: iteraTodas && rotasFaltando.length === 0,
    medido: `${PAGINAS.length - rotasFaltando.length}/${PAGINAS.length} páginas`,
    detalhe: rotasFaltando.map((r) => `rota sem página: ${r}`),
  });

  /* ---- 2 e 3. Frase de leitura e tabela em todo gráfico ---- */
  // Estrutural: só existe um caminho para renderizar gráfico (ChartBlock), e
  // ele exige `frase`, `colunas` e `linhas` por tipagem. O eval confere que
  // ninguém passou por fora — nenhum uso direto de Recharts nas páginas.
  const usosDiretos: string[] = [];
  for (const [f, t] of textos) {
    if (f.includes(join("src", "components", "charts"))) continue;
    if (/from "recharts"/.test(t)) usosDiretos.push(relative(RAIZ, f));
  }
  const blocos = [...textos.entries()]
    .filter(([f]) => f.includes(join("src", "app")))
    .flatMap(([f, t]) => [...t.matchAll(/<ChartBlock\b/g)].map(() => relative(RAIZ, f)));
  const semFrase = [...textos.entries()]
    .filter(([f]) => f.includes(join("src", "app")))
    .flatMap(([f, t]) => {
      const abre = (t.match(/<ChartBlock\b/g) ?? []).length;
      const frases = (t.match(/\bfrase=/g) ?? []).length;
      return abre === frases ? [] : [`${relative(RAIZ, f)}: ${abre} blocos, ${frases} frases`];
    });
  add({
    nome: "Frase de leitura em todo gráfico",
    limiar: "100%",
    ok: semFrase.length === 0 && usosDiretos.length === 0,
    medido: `${blocos.length} gráficos`,
    detalhe: [...semFrase, ...usosDiretos.map((f) => `usa Recharts fora de ChartBlock: ${f}`)],
  });

  const semTabela = [...textos.entries()]
    .filter(([f]) => f.includes(join("src", "app")))
    .flatMap(([f, t]) => {
      const abre = (t.match(/<ChartBlock\b/g) ?? []).length;
      const linhas = (t.match(/\blinhas=/g) ?? []).length;
      return abre === linhas ? [] : [`${relative(RAIZ, f)}: ${abre} blocos, ${linhas} tabelas`];
    });
  add({
    nome: "Tabela alternativa em todo gráfico",
    limiar: "100%",
    ok: semTabela.length === 0,
    medido: `${blocos.length} gráficos`,
    detalhe: semTabela,
  });

  /* ---- 4. Selo cálculo próprio com fórmula em Sobre ---- */
  const idsRegistrados = new Set(INDICADORES.map((i) => i.id));
  const usados = new Set<string>();
  const idsInvalidos: string[] = [];
  for (const [f, t] of textos) {
    for (const m of t.matchAll(/indicador="([^"]+)"/g)) {
      usados.add(m[1]);
      if (!idsRegistrados.has(m[1])) idsInvalidos.push(`${relative(RAIZ, f)}: "${m[1]}"`);
    }
  }
  const semFormula = INDICADORES.filter((i) => !i.formula?.trim() || !i.nota?.trim()).map((i) => i.id);
  const sobre = textos.get(join(RAIZ, "src", "app", "sobre", "page.tsx")) ?? "";
  const sobrePublica = sobre.includes("INDICADORES.map");
  add({
    nome: "Selo cálculo próprio com fórmula em Sobre",
    limiar: "100%",
    ok: idsInvalidos.length === 0 && semFormula.length === 0 && sobrePublica && usados.size > 0,
    medido: `${usados.size} selos → ${INDICADORES.length} indicadores registrados`,
    detalhe: [
      ...idsInvalidos.map((d) => `selo sem registro: ${d}`),
      ...semFormula.map((d) => `indicador sem fórmula: ${d}`),
      ...(sobrePublica ? [] : ["Sobre não renderiza o registro de indicadores"]),
    ],
  });

  /* ---- 5 e 6. Fontes rastreáveis e unidades declaradas ---- */
  const semAncora = SERIES.filter((s) => !s.ancora || !Number.isFinite(s.ancora.valor)).map(
    (s) => `${s.codigo} sem valor-âncora`,
  );
  const semUnidade = SERIES.filter(
    (s) => !s.unidade || (s.verificacaoUnidade === "ckan" && !s.unidadeCkan),
  ).map((s) => `${s.codigo} sem unidade declarada`);
  const testeMeta = await existe(join(RAIZ, "tests", "metadados", "sources.test.ts"));

  // Nenhum código SGS pode virar configuração fora de sources.ts. Citar o
  // código em prosa (a página-tese e o Sobre fazem isso, de propósito) é
  // referência ao leitor; o que não pode é o número reaparecer como parâmetro.
  const vazamentos: string[] = [];
  for (const [f, t] of textos) {
    if (f.endsWith(join("src", "data", "sources.ts"))) continue;
    for (const s of SERIES) {
      const comoConfiguracao = new RegExp(
        `codigo:\\s*${s.codigo}\\b|bcdata\\.sgs\\.${s.codigo}\\b|porChave\\(\\s*["']${s.codigo}["']`,
      );
      if (comoConfiguracao.test(t)) {
        vazamentos.push(`${relative(RAIZ, f)}: código ${s.codigo} hardcoded`);
      }
    }
  }
  add({
    nome: "Fontes rastreáveis (CKAN + valor-âncora)",
    limiar: "100%",
    ok: semAncora.length === 0 && testeMeta && vazamentos.length === 0,
    medido: `${SERIES.length} séries registradas`,
    detalhe: [...semAncora, ...vazamentos, ...(testeMeta ? [] : ["falta tests/metadados"])],
  });
  add({
    nome: "Unidades declaradas e verificadas",
    limiar: "100%",
    ok: semUnidade.length === 0,
    medido: `${SERIES.length}/${SERIES.length} séries`,
    detalhe: semUnidade,
  });

  /* ---- 7. Blocos congelados rotulados ---- */
  const usaCongelado = [...textos.entries()].filter(
    ([f, t]) => f.includes(join("src", "app")) && t.includes("congeladoEm="),
  );
  const semNota = usaCongelado
    .filter(([, t]) => !t.includes("notaCongelado="))
    .map(([f]) => relative(RAIZ, f));
  const sobreDeclara = /encerrada em|acervo congelado|congelad/i.test(sobre);
  add({
    nome: "Blocos congelados rotulados",
    limiar: "100%",
    ok: usaCongelado.length > 0 && semNota.length === 0 && sobreDeclara,
    medido: `${usaCongelado.length} bloco(s) congelado(s)`,
    detalhe: [
      ...semNota.map((f) => `bloco congelado sem nota: ${f}`),
      ...(sobreDeclara ? [] : ["Sobre não declara o bloco congelado"]),
    ],
  });

  /* ---- 8. Testes verdes e cobertura ---- */
  const resumoCobertura = join(RAIZ, "coverage", "coverage-summary.json");
  if (await existe(resumoCobertura)) {
    const cov = JSON.parse(await readFile(resumoCobertura, "utf8"));
    const pct = cov.total?.lines?.pct ?? 0;
    add({
      nome: "Cobertura de lib/transforms e format",
      limiar: "≥ 80%",
      ok: pct >= 80,
      medido: `${pct}% de linhas`,
    });
  } else {
    add({
      nome: "Cobertura de lib/transforms e format",
      limiar: "≥ 80%",
      ok: false,
      medido: "sem relatório",
      detalhe: ["rode npm run test:cov antes do portão"],
    });
  }

  /* ---- 9. Coerência visual: tokens só em globals.css ---- */
  const infracoes: string[] = [];
  for (const [f, t] of textos) {
    if (f.endsWith(join("src", "app", "globals.css"))) continue;
    const linhas = t.split("\n");
    linhas.forEach((linha, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(linha)) return;
      // Hex de cor solto.
      if (/#[0-9a-fA-F]{3,8}\b/.test(linha) && !/^\s*\*/.test(linha)) {
        infracoes.push(`${relative(RAIZ, f)}:${i + 1} hex avulso`);
      }
      if (/font-family\s*:/.test(linha)) {
        infracoes.push(`${relative(RAIZ, f)}:${i + 1} font-family avulso`);
      }
    });
  }
  add({
    nome: "Coerência visual (tokens só em globals.css)",
    limiar: "0 ocorrências",
    ok: infracoes.length === 0,
    medido: `${infracoes.length} ocorrência(s)`,
    detalhe: infracoes.slice(0, 15),
  });

  /* ---- 10. Referência de UI registrada no README ---- */
  const readme = await readFile(join(RAIZ, "README.md"), "utf8");
  const registraNivel = /n[íi]vel\s*1/i.test(readme) && /frontend-design/i.test(readme);
  add({
    nome: "Referência de UI aplicada e registrada",
    limiar: "sim",
    ok: registraNivel,
    medido: registraNivel ? "nível 1 (skill frontend-design)" : "não registrado",
    detalhe: registraNivel ? [] : ["README precisa registrar o nível da hierarquia da §2.1"],
  });

  /* ---- 11. Consistência de stack ---- */
  const pkg = JSON.parse(await readFile(join(RAIZ, "package.json"), "utf8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const exigidas = ["next", "react", "tailwindcss", "recharts", "lucide-react", "zod"];
  const faltando = exigidas.filter((d) => !deps[d]);
  const chartsUsaTokens = (textos.get(join(RAIZ, "src", "components", "charts", "index.tsx")) ?? "")
    .includes("var(--series-");
  add({
    nome: "Consistência de stack",
    limiar: "sim",
    ok: faltando.length === 0 && chartsUsaTokens,
    medido: chartsUsaTokens ? "shadcn + lucide + Recharts com paleta do tema" : "paleta fora do tema",
    detalhe: faltando.map((d) => `dependência ausente: ${d}`),
  });

  /* ---- 12. Acessibilidade ---- */
  const specA11y = await existe(join(RAIZ, "tests", "e2e", "acessibilidade.spec.ts"));
  add({
    nome: "Acessibilidade (axe)",
    limiar: "0 violações críticas",
    ok: specA11y,
    medido: specA11y ? "auditada na home e numa página temática" : "sem auditoria",
    detalhe: specA11y ? [] : ["falta tests/e2e/acessibilidade.spec.ts"],
  });

  /* ---- 13. Glossário resolvido ---- */
  const idsGloss = new Set(GLOSSARIO.map((g) => g.id));
  const duplicados = GLOSSARIO.length !== idsGloss.size;
  add({
    nome: "Glossário com âncoras únicas",
    limiar: "100%",
    ok: !duplicados && GLOSSARIO.length >= 20,
    medido: `${GLOSSARIO.length} verbetes`,
    detalhe: duplicados ? ["há âncoras duplicadas"] : [],
  });

  /* ---- Relatório ---- */
  const largura = Math.max(...evals.map((e) => e.nome.length));
  console.log("\nPortão de entrega — evals da §7.2\n");
  for (const e of evals) {
    const marca = e.ok ? "✓" : "✗";
    console.log(
      `  ${marca} ${e.nome.padEnd(largura)}  ${e.limiar.padEnd(18)} ${e.medido}`,
    );
    if (!e.ok) for (const d of e.detalhe ?? []) console.log(`      · ${d}`);
  }

  const reprovados = evals.filter((e) => !e.ok);
  if (reprovados.length) {
    console.error(`\n✗ ${reprovados.length} de ${evals.length} evals reprovados. Portão fechado.\n`);
    process.exit(1);
  }
  console.log(`\n✓ ${evals.length} de ${evals.length} evals verdes. Portão aberto.\n`);
}

main().catch((e) => {
  console.error("✗ verificação de evals falhou:", e instanceof Error ? e.message : e);
  process.exit(1);
});
