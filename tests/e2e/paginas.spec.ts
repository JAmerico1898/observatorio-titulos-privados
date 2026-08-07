import { expect, test, type Page } from "@playwright/test";

import { PAGINAS } from "../../src/data/paginas";
import fidc from "../../src/data/generated/fidc.json";
import meta from "../../src/data/generated/meta.json";
import sgs from "../../src/data/generated/sgs.json";

/**
 * E2E por página (spec §7.1).
 *
 * Os JSONs gerados são o fixture: são exatamente os dados que o build
 * consumiu, então os valores esperados aqui são derivados da mesma fonte que
 * a página renderizou — o teste confere a cadeia inteira (dado → transform →
 * formatação → DOM), não só que a página abriu.
 */

const ultimoValor = (chave: string): number => {
  const s = sgs.series.find((x) => x.chave === chave)!;
  const p = [...s.pontos].reverse().find((x) => x.valor !== null)!;
  return p.valor as number;
};

/** Mesma regra do painel: R$ milhões → notação compacta com vírgula decimal. */
function brl(milhoes: number): string {
  if (milhoes === 0) return "R$ 0";
  const v = Math.abs(milhoes);
  const f = (n: number) => n.toFixed(1).replace(".", ",");
  if (v >= 1_000_000) return `R$ ${f(v / 1_000_000)} tri`;
  if (v >= 1_000) return `R$ ${f(v / 1_000)} bi`;
  return `R$ ${f(v)} mi`;
}

/** Todo gráfico precisa de frase de leitura e tabela alternativa (evals §7.2). */
async function conferirBlocosDeGrafico(page: Page) {
  const blocos = page.locator("figure[data-chart-block]");
  const total = await blocos.count();
  expect(total, "a página deveria ter ao menos um gráfico").toBeGreaterThan(0);

  for (let i = 0; i < total; i++) {
    const bloco = blocos.nth(i);
    const titulo = (await bloco.locator("h3").first().innerText()).trim();

    const frase = bloco.locator("[data-frase-leitura]");
    await expect(frase, `sem frase de leitura em "${titulo}"`).toHaveCount(1);
    expect((await frase.innerText()).trim().length, `frase vazia em "${titulo}"`).toBeGreaterThan(20);

    const botao = bloco.getByRole("button", { name: /ver em tabela/i });
    await expect(botao, `sem tabela alternativa em "${titulo}"`).toHaveCount(1);
    await botao.click();
    await expect(bloco.locator("table"), `tabela não abriu em "${titulo}"`).toBeVisible();
    await bloco.getByRole("button", { name: /ocultar tabela/i }).click();
  }
}

test.describe("todas as páginas", () => {
  for (const p of PAGINAS) {
    test(`${p.rotulo} carrega, tem título e navegação`, async ({ page }) => {
      const erros: string[] = [];
      page.on("pageerror", (e) => erros.push(String(e)));

      const resposta = await page.goto(p.href);
      expect(resposta?.status()).toBe(200);

      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page).toHaveTitle(/Monitor de Títulos Privados/);
      await expect(page.getByRole("navigation", { name: "Seções do painel" })).toBeVisible();
      await expect(page.getByRole("contentinfo")).toBeVisible();
      expect(erros, `erros de runtime em ${p.href}`).toEqual([]);
    });
  }
});

test.describe("gráficos", () => {
  // A home e as cinco páginas temáticas têm gráficos; glossário e sobre não.
  const comGraficos = PAGINAS.filter((p) => !["/glossario", "/sobre"].includes(p.href));
  for (const p of comGraficos) {
    test(`${p.rotulo}: todo gráfico tem frase de leitura e tabela`, async ({ page }) => {
      await page.goto(p.href);
      await conferirBlocosDeGrafico(page);
    });
  }
});

test("página-tese publica os KPIs que os dados sustentam", async ({ page }) => {
  await page.goto("/credito-e-desintermediacao");

  const mercCap = ultimoValor("mercCapEmpresas");
  const credBanc = ultimoValor("credBancarioEmpresas");
  const participacao = (100 * mercCap) / (mercCap + credBanc);

  await expect(page.getByText(brl(mercCap), { exact: true }).first()).toBeVisible();
  await expect(page.getByText(brl(credBanc), { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText(`${participacao.toFixed(1).replace(".", ",")}%`, { exact: true }).first(),
  ).toBeVisible();

  // O gráfico do cruzamento existe e traz a régua vertical do mês da virada.
  await expect(page.getByText("cruzamento").first()).toBeVisible();
});

test("indicadores derivados levam selo e a fórmula está em Sobre", async ({ page }) => {
  await page.goto("/credito-e-desintermediacao");
  expect(await page.getByText("cálculo próprio").count()).toBeGreaterThan(0);

  await page.goto("/sobre");
  await expect(page.getByText("SGS 28851 ÷ (SGS 28851 + SGS 28848)")).toBeVisible();
});

test("bloco congelado se distingue das séries vivas", async ({ page }) => {
  await page.goto("/captacao-bancaria");
  const congelado = page.locator("figure[data-congelado='true']");
  await expect(congelado).toHaveCount(1);
  await expect(congelado.getByText("série encerrada")).toBeVisible();
  // A data de corte tem de estar no próprio título, não só na nota de rodapé.
  await expect(congelado.getByRole("heading", { name: /encerrada em 11\/12\/2025/ })).toBeVisible();
});

test("KPIs de FIDC batem com o informe mais recente", async ({ page }) => {
  await page.goto("/fidcs");
  const u = fidc.meses.at(-1)!;
  await expect(page.getByText(brl(u.plTotal), { exact: true }).first()).toBeVisible();
  const inad = (100 * u.creditosVencidos) / u.carteiraDireitosCreditorios;
  await expect(
    page.getByText(`${inad.toFixed(2).replace(".", ",")}%`, { exact: true }).first(),
  ).toBeVisible();
});

test("glossário resolve as âncoras que as páginas linkam", async ({ page }) => {
  await page.goto("/glossario");
  const indice = page.getByRole("navigation", { name: "Índice do glossário" });
  const links = indice.getByRole("link");
  const total = await links.count();
  expect(total).toBeGreaterThan(20);

  for (let i = 0; i < total; i++) {
    const href = await links.nth(i).getAttribute("href");
    const id = href!.replace("#", "");
    await expect(page.locator(`#${id}`), `verbete ${id} não existe`).toHaveCount(1);
  }
});

test("Sobre publica fonte, perímetro e limitações", async ({ page }) => {
  await page.goto("/sobre");
  await expect(page.getByRole("heading", { name: "Fontes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Perímetros" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Limitações declaradas" })).toBeVisible();
  await expect(page.getByText(/Monitor independente, de finalidade educacional/)).toBeVisible();
  await expect(page.getByText(`SGS ${sgs.series[0].codigo}`).first()).toBeVisible();
  // O mês de referência exibido é o que o pipeline gravou.
  const [ano, m] = meta.mesReferencia.split("-");
  const nomes = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  await expect(page.getByText(`${nomes[Number(m) - 1]} de ${ano}`).first()).toBeVisible();
});

test("navegação leva a todas as páginas", async ({ page }) => {
  await page.goto("/");
  for (const p of PAGINAS.slice(1)) {
    await page.getByRole("navigation", { name: "Seções do painel" }).getByRole("link", { name: p.rotulo, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${p.href}$`));
  }
});
