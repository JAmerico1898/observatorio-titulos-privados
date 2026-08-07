# Monitor de Títulos Privados

Painel do **Laboratório de Mercado Financeiro (COPPEAD–FGV–UCAM)** sobre o estoque de renda fixa
privada no Brasil e a **desintermediação financeira** — a migração do crédito às empresas do balanço
dos bancos para o mercado de capitais.

Somente leitura, sem login, sem estado de usuário. Todos os dados são pré-processados no build:
**nenhuma chamada a API externa acontece no navegador do aluno.**

Especificação: [`spec/spec.md`](spec/spec.md) (v2).

## O achado

Em **junho de 2026**, o estoque de títulos de dívida emitidos por empresas (**R$ 2,556 tri**)
superou o saldo de empréstimos e financiamentos do SFN a empresas (**R$ 2,361 tri**). Sob o
perímetro dos dois canais domésticos, o mercado de capitais responde por **52,0%** do financiamento
às empresas; sob o crédito ampliado, o mesmo fenômeno aparece como **35,4%**. As duas curvas se
cruzaram em **maio de 2025**.

## Stack

TypeScript · Next.js 16 (App Router, páginas estáticas) · React 19 · Tailwind v4 · shadcn/ui +
lucide · Recharts · Zod · Vitest · Playwright + axe.

## Referência de UI aplicada

**Nível 1** da hierarquia da §2.1 da spec: a skill **`frontend-design`** estava instalada na máquina
de build e foi lida antes de escrever qualquer componente. A direção resultante:

- **Registro/medição.** O painel mede um estoque, então o chão é papel de razão levemente frio e os
  números usam face monoespaçada tabular. Os números são o assunto, não um detalhe do layout.
- **Trio tipográfico.** Newsreader (voz editorial) · IBM Plex Sans (registro técnico) · IBM Plex
  Mono (os números).
- **Dispositivo estrutural: procedência.** Cada bloco abre com o *eyebrow* da fonte
  (`SGS 28851 · BCB`) em vez de numeração decorativa — num painel cuja credibilidade depende de
  rastreabilidade, a origem do número é a informação que a estrutura deve carregar.
- **Assinatura.** O cruzamento das duas curvas, com régua vertical no mês da virada, sobre chão de
  papel milimetrado no bloco de abertura.

A **paleta categórica** foi validada pelo validador do skill `dataviz` (banda de luminosidade, piso
de croma, separação CVD adjacente, piso de visão normal e contraste) na superfície `#fcfcfb`. Três
slots ficam abaixo de 3:1 de contraste; a regra de *relief* é cumprida por construção, porque
**100% dos gráficos** têm legenda e tabela alternativa acoplada.

Todos os tokens vivem **uma única vez** em `src/app/globals.css`. O portão falha se aparecer hex ou
`font-family` avulso em componente.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | desenvolvimento |
| `npm run verify` | **o portão inteiro**: typecheck, lint, testes com cobertura, build, e2e e evals |
| `npm run fetch-data` | pipeline semanal (SGS + metadados + valor-âncora) |
| `npm run backfill:fidc` | carga única CVM 2013→ (não roda no cron) |
| `npm run backfill:cetip` | carga única B3/CETIP LCI e LCA (não roda no cron) |
| `npm test` / `npm run test:e2e` | testes isolados |

## Arquitetura de dados

```
scripts/fetch-data.ts   →  src/data/generated/sgs.json + meta.json   (semanal, automático)
scripts/backfill-*.ts   →  src/data/generated/fidc.json + cetip.json (uma vez, commitado)
                        →  páginas estáticas geradas no build
```

**Fontes** — todas sem autenticação:

- **BCB/SGS** — 16 séries: captação bancária (27805–27809), títulos de dívida e crédito às empresas
  (28189–28191, 28846–28852), custo do crédito (25351, 25352, 27443) e Selic (4189).
- **BCB/Dados Abertos (CKAN)** — metadados por código: título oficial, unidade, periodicidade.
- **CVM** — informes mensais de FIDC, 2013 a hoje.
- **B3/CETIP** — acervo congelado, apenas LCI e LCA, encerrado em 11/12/2025.

### Duas defesas contra dado errado

Toda série passa, a cada execução, por **dois testes independentes**:

1. **Metadados** — título e unidade conferidos contra o CKAN. Pega renomeação e troca de unidade.
2. **Valor-âncora** — valor conhecido em mês conhecido, conferido contra a API de dados. Pega a
   troca silenciosa do conteúdo de um código quando os metadados não mudam.

Um não cobre o outro. Falha de qualquer fonte **aborta** o pipeline: nunca se publica dado parcial.

> **Armadilha de unidade.** A família 27xxx vem em **R$ mil**; a 28xxx, em **R$ milhões**. Somá-las
> sem normalizar produz erro de 1.000× invisível a olho nu. `normalizar()` é obrigatória em qualquer
> operação que cruze as duas, e há teste dedicado a isso.

## O que este painel não faz

Sem nenhuma fonte autenticada, três limitações são declaradas em **Sobre**:

- Não há curvas de crédito nem spreads de debêntures (exigiriam ANBIMA).
- **CRI e CRA não são separáveis** em fonte pública gratuita; aparecem agregados em *securitizados*.
- A decomposição **LCI × LCA** vem de acervo da CETIP **encerrado em 11/12/2025**, com valores
  arredondados na origem — exibida em bloco congelado, visualmente distinto das séries vivas.

Duas ressalvas adicionais, ambas encontradas ao processar os dados e declaradas no painel:

- O índice de subordinação dos FIDCs agrega **apenas informes cujas cotas reconciliam com o PL
  declarado** pelo próprio fundo (±5%). Sem esse filtro, um único informe com cota de R$ 103 bilhões
  inflava o agregado de jan/2013 em 40×. A cobertura alcançada aparece na tabela de cada mês.
- A série de subordinação tem **quebra em dez/2025**, por reclassificação dos rótulos de cota na
  transição para a Resolução CVM 175. A quebra é detectada nos dados, marcada no gráfico e explicada
  em Sobre — não é emendada.

## Portão de entrega

`npm run verify` roda os 13 evals da §7.2 da spec. O deploy só ocorre com **100% verde**; `main` é
protegido e o CI roda a cada push e PR.

Os evals medem o que os testes sozinhos não pegam: cobertura de páginas por e2e, frase de leitura e
tabela em **todos** os gráficos, todo selo *cálculo próprio* referenciando um indicador com fórmula
publicada em Sobre, toda série com metadados e âncora, nenhum código SGS hardcoded fora de
`sources.ts`, nenhum token de cor fora de `globals.css`, e zero violação crítica de acessibilidade.

---

Painel independente, de finalidade educacional, **sem vínculo** com BCB, CVM ou B3.
