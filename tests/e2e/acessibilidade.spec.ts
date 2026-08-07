import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Acessibilidade (spec §7.2): zero violações críticas.
 *
 * Vale mais aqui do que num site comum: a paleta categórica tem três cores que
 * ficam abaixo de 3:1 de contraste contra a superfície, e o painel só pode
 * usá-las porque toda figura carrega tabela alternativa e legenda. Se essa
 * compensação quebrar, é aqui que aparece.
 */

const PAGINAS_AUDITADAS = [
  { href: "/", rotulo: "Início" },
  { href: "/credito-e-desintermediacao", rotulo: "Crédito e Desintermediação" },
];

for (const p of PAGINAS_AUDITADAS) {
  test(`${p.rotulo}: sem violações críticas ou sérias`, async ({ page }) => {
    await page.goto(p.href);
    // Espera o Recharts montar: um SVG que aparece depois da auditoria não
    // teria sido auditado.
    await page.locator("svg.recharts-surface").first().waitFor({ state: "attached" });

    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const graves = violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(
      graves.map((v) => `${v.impact} · ${v.id}: ${v.help} (${v.nodes.length} nó(s))`),
      "violações críticas ou sérias de acessibilidade",
    ).toEqual([]);
  });
}

test("tabela alternativa é navegável por teclado", async ({ page }) => {
  // A tabela é o "relief" que autoriza a paleta; se só abrir com mouse, a
  // compensação não vale para quem navega por teclado.
  await page.goto("/credito-e-desintermediacao");
  const botao = page.getByRole("button", { name: /ver em tabela/i }).first();
  await botao.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("table").first()).toBeVisible();
});
