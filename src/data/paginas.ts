/**
 * Navegação do painel (spec §4).
 *
 * Fica fora de `Nav.tsx` de propósito: `Nav` é componente de cliente, e o que
 * atravessa essa fronteira vira referência, não valor — a home não conseguiria
 * iterar a lista se ela morasse lá.
 */
export const PAGINAS = [
  { href: "/", rotulo: "Início" },
  { href: "/captacao-bancaria", rotulo: "Captação Bancária" },
  { href: "/mercado-de-capitais", rotulo: "Mercado de Capitais" },
  { href: "/fidcs", rotulo: "FIDCs" },
  { href: "/credito-e-desintermediacao", rotulo: "Crédito e Desintermediação" },
  { href: "/custo-do-credito", rotulo: "Custo do Crédito" },
  { href: "/glossario", rotulo: "Glossário" },
  { href: "/sobre", rotulo: "Sobre" },
] as const;
