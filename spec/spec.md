# Especificação — Painel de Títulos Privados

## Laboratório de Mercado Financeiro | COPPEAD–FGV–UCAM

**Versão:** v2 (pós-apuração de fontes, pré-implementação)
**Público-alvo:** alunos de MBA e pós-graduação em finanças, com base quantitativa média — tom técnico, sem simplificação excessiva; jargão permitido desde que definido no Glossário.
**Referência estrutural:** `https://tesouro-nacional.vercel.app` (Painel da Dívida Pública Federal) — mesmo padrão editorial: KPI cards com variação mensal, páginas temáticas, frase de leitura sob cada gráfico, tabela alternativa acessível, Glossário e página Sobre com metodologia e selo "cálculo próprio".

---

## 0. O que mudou da v1 para a v2 (e por quê)

A v1 foi escrita antes de qualquer fonte ser testada. Em 07/08/2026 as três fontes foram sondadas ao vivo e **três premissas da v1 não se confirmaram**. Esta seção existe para que nenhuma decisão desta spec pareça arbitrária mais tarde — cada delta abaixo tem evidência.

| # | Premissa v1 | O que a apuração mostrou | Delta na v2 |
|---|-------------|--------------------------|-------------|
| 1 | B3 publica CSV de estoque registrado, com URL padronizada por data | A API pública existe (`arquivos.b3.com.br`, UP2DATA), mas o acervo de balcão (`HistoricoRF`, herdado da CETIP) está **congelado em 11/12/2025**, **não contém debêntures, CRI nem CRA**, e traz valores arredondados a 2–3 algarismos significativos. O subcanal vivo é só segmento listado. | B3 sai do pipeline recorrente. Sobrevive **um único arquivo congelado** (LCI e LCA), baixado uma vez e commitado. |
| 2 | O SGS tem endpoint de metadados para o teste da §3.2 | `www3.bcb.gov.br/sgspub` é aplicação JSP com sessão (devolveu HTTP 500 e `alert("Session expired")`); a API de dados devolve só `data;valor`, sem nome nem unidade. | O teste de metadados passa a usar o **CKAN de dados abertos do BCB**, que devolve título oficial, unidade de medida e periodicidade por código. |
| 3 | O numerador da desintermediação precisa ser montado à mão (`deb + cri + cra + plFIDC`) | O BCB **já publica** o agregado consolidado: `Saldo de títulos de dívida emitidos por empresas` (SGS 28851), e a nota EE049 confirma que ele inclui CRI, CRA **e os direitos creditórios nas carteiras dos FIDCs**. | §6 reescrita para séries oficiais. Somar PL de FIDC por fora passaria a ser dupla contagem contra a parcela "securitizados". |
| 4 | O SGS publica taxa média de captação para a §4.6 | A série `28663` existe, está em % a.a., mas **foi descontinuada em jan/2024**. Não há substituta viva. | A §4.6 passa a medir o **ICC — Indicador de Custo do Crédito** e o **Spread do ICC**, vivos e no mesmo mês de referência do resto do painel. Isso **altera um objetivo de aprendizagem** da §1. |
| 5 | CRI e CRA podem ser exibidos separadamente | Não existem separados em nenhuma fonte pública e gratuita — nem no SGS (só "securitizados" agregado) nem no acervo CETIP. | O gráfico "barras empilhadas CRI × CRA" da §4.3 é substituído. A ausência é declarada em Sobre. |

**Armadilha de unidade documentada:** a família *Meios de pagamento amplos* (SGS 27805–27815) está em **R$ mil**; as séries de crédito e títulos de dívida (SGS 28183–28855) estão em **R$ milhões**. Misturá-las produz erro de 1.000× invisível a olho nu. É o principal motivo pelo qual o teste de metadados da §3.2 é obrigatório e não decorativo.

---

## 1. Visão geral

O painel monitora o **estoque em R$ dos títulos privados de renda fixa no Brasil** — a captação bancária (depósitos a prazo/CDB/RDB, letras de crédito, letras financeiras), a dívida corporativa no mercado de capitais (debêntures e notas comerciais, securitização) e o patrimônio dos FIDCs — **e o estoque de crédito bancário às empresas**, respondendo, com dados oficiais e gratuitos: *quanto existe emitido, como esse estoque evolui, como ele se reparte entre funding bancário e mercado de capitais, e a que custo as empresas se financiam no banco*.

A **tese central do painel é a desintermediação financeira**: medir, ao longo do tempo, a migração do crédito às empresas do balanço dos bancos (empréstimos e financiamentos do SFN) para o mercado de capitais (títulos de dívida privados e securitizados). A página *Crédito e Desintermediação* (4.5) é o coração analítico do app.

É um painel **somente leitura** (sem login, sem estado de usuário), com dados pré-processados em build — nenhuma chamada a API externa acontece no navegador do aluno.

### O achado que abre o painel

Em **junho de 2026**, o estoque de títulos de dívida emitidos por empresas (**R$ 2,556 tri**) **superou** o saldo de empréstimos e financiamentos do SFN a empresas (**R$ 2,361 tri**). Sob o perímetro dos dois canais domésticos, o mercado de capitais responde por **52,0%** do financiamento às empresas. A virada já ocorreu — o painel não anuncia uma tendência, mede um fato consumado. A frase de leitura da 4.5 é obrigada a registrar que o número é sensível ao perímetro: sob o crédito ampliado total a empresas, a mesma realidade aparece como 35,4%.

### Objetivos de aprendizagem

- Distinguir o funding bancário (depósitos a prazo e letras) do funding via mercado de capitais (debêntures, securitização), quantificando o tamanho relativo de cada canal.
- Interpretar a evolução do estoque de cada instrumento (nível, variação mensal, variação em 12 meses) e relacioná-la ao ciclo de juros.
- Ler os indicadores estruturais dos FIDCs (PL agregado, inadimplência da carteira, índice de subordinação) como métricas de risco de crédito estruturado, e localizá-los dentro do braço "securitizados" do mercado de capitais.
- **Avaliar o custo e o spread do crédito bancário (ICC) como mecanismo econômico que empurra a empresa para o mercado de capitais.** *(alterado na v2 — a v1 pedia custo de captação vs. CDI, cuja série foi descontinuada)*
- Quantificar a **desintermediação financeira** e discutir criticamente como a escolha do perímetro estatístico muda a magnitude do fenômeno sem mudar sua direção.

### Premissas assumidas

- **Identidade visual:** definida pela hierarquia da seção 2. O painel **não** herda os tokens congelados dos laboratórios de cenários; herda apenas o padrão editorial (frases de leitura, tabelas alternativas, selo cálculo próprio).
- **Perímetro da desintermediação:** o lado bancário é `Saldo de empréstimos e financiamentos do SFN a empresas` (SGS 28848); o lado mercado de capitais é `Saldo de títulos de dívida emitidos por empresas` (SGS 28851). Ambos oficiais, mesma nota metodológica, mesmo mês de referência. O crédito ampliado a empresas (SGS 28846) é a série de **validação cruzada**, exibida sobreposta. Dívida externa e fundos governamentais ficam **fora** do denominador principal — limitação declarada em Sobre.
- **FIDCs não são somados ao numerador.** Os direitos creditórios de suas carteiras já estão dentro de 28851, na parcela "securitizados". Os FIDCs entram por **decomposição** e ganham página própria. (Não há dupla contagem contra o crédito bancário: a cessão com transferência substancial de riscos baixa o ativo do balanço do cedente, Res. 3.533/CMN.)
- **Janela canônica: janeiro de 2013 até o mês mais recente**, uniforme em todas as páginas e gráficos. É onde começam o crédito ampliado e os informes de FIDC. Séries que existem antes disso (captação bancária desde 2001, CETIP desde 1994) são truncadas, salvo nos blocos históricos explicitamente rotulados.
- **Periodicidade:** atualização **semanal** via GitHub Actions (cron); todas as séries centrais são mensais.
- **Sem ANBIMA:** nenhuma fonte com autenticação — o painel não exibe curvas de crédito nem spreads de debêntures, e não separa CRI de CRA.

## 2. UI, design e stack

### 2.1 Hierarquia de referência visual (nesta ordem, sem misturar níveis)

1. **Skill `design-taste-frontend`** — se estiver instalada na máquina de build, o construtor **deve** lê-la antes de escrever qualquer componente e seguir suas diretrizes de direção estética, tipografia e composição. (Nota: em ambientes Anthropic, a skill equivalente pode estar publicada como `frontend-design` — vale como a mesma referência.)
2. **Na ausência da skill:** usar **`https://tesouro-nacional.vercel.app`** como referência de design — replicar sua linguagem visual (densidade editorial, hierarquia tipográfica, cards, navegação, rodapé), inspecionando o site publicado.
3. **Na ausência de acesso ao site:** adotá-lo como **inspiração estética** a partir da descrição desta spec: painel editorial claro, sóbrio, denso em informação e pobre em ornamento; tipografia serifada ou humanista para títulos com forte contraste de peso; números tabulares em destaque; cor usada com parcimônia e significado (variações, selos), nunca decorativa.

> **Nível aplicado nesta construção: 1.** A skill `frontend-design` está instalada na máquina de build. Registrar no README com essa justificativa.

Qualquer que seja o nível aplicado, os tokens resultantes (cores, fontes, raios, espaçamentos) são definidos **uma única vez** em `src/app/globals.css` e consumidos via variáveis — nenhum hex ou fonte avulsa em componente.

### 2.2 Stack (fixo)

- **TypeScript + Next.js (App Router) + React + Tailwind v4 + shadcn/ui (ícones lucide)**; **Recharts** para gráficos, com paleta derivada dos tokens do tema.
- Componentes base shadcn (`Card`, `Button`, `Badge`, `Tabs`) + três componentes de domínio do painel: `KpiCard`, `ChartBlock`, `DataTable` (seção 5).
- Publica no **GitHub + Vercel** (deploy apenas do branch principal, condicionado ao CI verde).
- Repositório: `https://github.com/JAmerico1898/observatorio-titulos-privados` (público).

## 3. Arquitetura de dados

### 3.1 Fontes (todas sem autenticação)

| Fonte | Endpoint | O que fornece | Frequência |
|-------|----------|---------------|------------|
| **BCB — SGS (dados)** | `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{cod}/dados?formato=json` | Captação bancária (27805–27809); crédito ampliado e sua decomposição (28183–28855); ICC e Spread do ICC (25351, 25352, 27443); CDI e Selic | Mensal (saldos) / diária (CDI) |
| **BCB — Dados Abertos (CKAN)** | `https://dadosabertos.bcb.gov.br/api/3/action/package_search` e `package_show` | **Metadados por código de série**: título oficial, unidade de medida, periodicidade, conceito, fonte. Base do teste da §3.2 | Estático |
| **CVM — Dados Abertos (FIDC)** | `.../INF_MENSAL/DADOS/inf_mensal_fidc_{AAAAMM}.zip` e `.../HIST/inf_mensal_fidc_{AAAA}.zip` | Informes mensais por fundo: PL, carteira, créditos vencidos/inadimplentes, cotas sênior × subordinadas. Corrente: 2025-01→; histórico: 2013–2024 em zips anuais | Mensal |
| **B3/CETIP — acervo congelado** | UP2DATA, canal `Web` › subcanal `HistoricoRF` | **Somente** `Estoque-LCI` e `Estoque-LCA`, para a decomposição que o SGS não publica. Série encerrada em 11/12/2025, valores arredondados | **Não recorrente** — baixado uma vez, agregado e commitado |

O acesso ao UP2DATA é em dois passos: `GET /api/download/requestname?fileName={nome}&date={data}` devolve `{redirectUrl:"~/download?token=…"}`; o token é então resolvido em `GET /api/{path}`. Isso vale apenas para o script de carga única — **não entra no pipeline semanal**.

### 3.2 Regra de fixação de séries e teste de metadados (obrigatória)

Todos os códigos SGS ficam registrados em `src/data/sources.ts` com: código, **título oficial**, **unidade de medida**, **periodicidade**, data de início e URL canônica. Nenhum código aparece hardcoded fora desse arquivo.

Um **teste automatizado de metadados** consulta o CKAN do BCB para cada código registrado e falha se o título ou a unidade divergirem do que está em `sources.ts`. Reforçando esse teste, cada série carrega também um **valor-âncora** (valor conhecido em data conhecida) verificado contra a API de dados — de modo que a troca silenciosa do conteúdo de um código quebre o CI mesmo que os metadados continuem iguais.

A unidade declarada é usada pelo pipeline para normalizar tudo a **R$ milhões** antes de qualquer agregação. Séries de unidades diferentes nunca são somadas sem passar por essa normalização.

### 3.3 Pipeline

- `scripts/fetch-data.ts` (Node/TS, sem Python): baixa as fontes, valida schema com **Zod**, transforma e grava JSONs estáticos em `src/data/generated/` (um arquivo por página + um `meta.json` com a data de processamento e o período mais recente de cada fonte).
- `scripts/backfill-fidc.ts` e `scripts/backfill-cetip.ts`: cargas **únicas**, rodadas localmente. Baixam o histórico completo (CVM 2013–2024 + CETIP LCI/LCA), agregam e gravam JSONs que são **commitados**. O pipeline semanal nunca as executa.
- **GitHub Actions (cron semanal)** roda `fetch-data`, commita os JSONs se houver mudança e dispara o deploy na Vercel. Falha de qualquer fonte **não** publica dados parciais: o workflow aborta e mantém a última versão íntegra.
- As páginas são **estáticas** (App Router, geração no build lendo os JSONs). Zero fetch no cliente.
- Todo indicador derivado recebe o selo **"cálculo próprio"**, com a fórmula documentada em Sobre.

## 4. Páginas

Navegação superior fixa: **Início · Captação Bancária · Mercado de Capitais · FIDCs · Crédito e Desintermediação · Custo do Crédito · Glossário · Sobre**. Rodapé com crédito, contato, data de processamento e link para fontes e metodologia.

### 4.1 Início
- Hero: título "O estoque de títulos privados, medido" + subtítulo técnico (uma frase sobre perímetro e fontes).
- **KPI cards (linha 1 — o estoque hoje):** estoque total monitorado (captação bancária + títulos de dívida de empresas, selo cálculo próprio); captação bancária total (SGS 27809); títulos de dívida de empresas (28851); PL agregado dos FIDCs (CVM). Cada card: valor, seta e variação % vs. mês anterior, mês de referência.
- **KPI cards (linha 2 — o crédito):** saldo de empréstimos do SFN a empresas (28848); **participação do mercado de capitais no crédito às empresas** em % (cálculo próprio); ICC pessoas jurídicas (25352); Spread do ICC em p.p. (27443).
- **Gráfico de abertura:** área empilhada do estoque por instrumento, 2013 → mês corrente.
- Bloco "Por onde começar" com cards-link para as páginas temáticas.
- Bloco "Como ler este painel": estoque ≠ emissão no ano; valores correntes; todo gráfico tem frase de leitura e tabela; onde diz cálculo próprio; por que a janela começa em 2013.

### 4.2 Captação Bancária
- KPIs: depósitos a prazo/CDB/RDB (27805), letras de crédito (27807), letras financeiras (27806), outros títulos privados (27808), com variação mensal.
- Gráficos: (a) linhas — evolução do saldo de cada instrumento; (b) barras — variação em 12 meses por instrumento; (c) área 100% — participação de cada instrumento na captação total (cálculo próprio).
- **Bloco histórico congelado — LCI × LCA:** rotulado *"Série histórica CETIP, encerrada em 11/12/2025; valores arredondados na origem"*. Gráfico da decomposição LCI × LCA que sustenta a leitura sobre isenção de IR. Visualmente separado dos blocos vivos, com data de corte no próprio título.
- Leitura técnica esperada: efeito da isenção de IR de LCI/LCA sobre a composição; sensibilidade da captação ao ciclo da Selic.

### 4.3 Mercado de Capitais
- KPIs: títulos de dívida privados de empresas — debêntures e notas comerciais (28852); securitizados (28851 − 28852, cálculo próprio); razão mercado de capitais ÷ captação bancária (cálculo próprio).
- Gráficos: (a) linhas — evolução dos dois braços, privados × securitizados; (b) razão mercado de capitais ÷ captação bancária ao longo do tempo (cálculo próprio) — o gráfico-tese da página; (c) composição dos títulos de dívida totais em públicos (28189) × privados (28190) × securitizados (28191), que abre a leitura de *crowding out* — em jun/2026 os públicos superam os privados em mais de cinco vezes.
- Frase de leitura padrão explicitando que estoque ≠ volume emitido no período.
- **Aviso de escopo visível:** CRI e CRA não são separáveis em fonte pública gratuita; aparecem agregados em "securitizados".

### 4.4 FIDCs
- KPIs: número de fundos reportantes, PL agregado, % de créditos vencidos sobre a carteira (cálculo próprio), índice de subordinação médio ponderado por PL (cálculo próprio).
- Gráficos: (a) PL agregado mensal; (b) inadimplência agregada da carteira; (c) distribuição do PL por classe de recebível (barras horizontais, último mês).
- **Ligação com a tese:** um bloco relaciona o PL agregado dos FIDCs ao braço "securitizados" da 4.3, explicando que os direitos creditórios dessas carteiras já estão contados dentro do agregado oficial do BCB — e que por isso o painel os decompõe em vez de somá-los.
- Nota metodológica visível: dados de informes mensais CVM, agregados pelo painel; fundos sem informe no mês são excluídos do agregado daquele mês.

### 4.5 Crédito e Desintermediação (página-tese)
- **KPIs:** saldo de empréstimos do SFN a empresas (28848); títulos de dívida emitidos por empresas (28851); **participação do mercado de capitais no crédito às empresas** em % (cálculo próprio) — o número-síntese do painel; variação dessa participação em 12 meses, em p.p.
- **Gráficos:** (a) linhas — crédito bancário × mercado de capitais, em R$, mesma escala, evidenciando o ponto de cruzamento; (b) área 100% — participação relativa dos dois canais ao longo do tempo (o gráfico-tese); (c) barras — variação em 12 meses de cada canal, lado a lado; (d) linha de validação — a mesma participação medida contra o crédito ampliado a empresas (28846), sobreposta, com a divergência de perímetro comentada na frase de leitura.
- **Bloco de leitura técnica** (tom MBA): mecanismos da desintermediação — custo regulatório do balanço bancário (capital, compulsório), isenções tributárias de instrumentos incentivados, ciclo de juros, apetite dos fundos de crédito, e o custo do crédito bancário medido na 4.6. Caveat sobre a fronteira porosa entre os canais, já que FIDCs carregam recebíveis originados por bancos.
- **Nota metodológica visível:** os dois perímetros e por que produzem 52,0% e 35,4% para o mesmo fenômeno; o que fica de fora do denominador principal (dívida externa, fundos governamentais, outras sociedades financeiras).

### 4.6 Custo do Crédito
*(reformulada na v2 — a série de taxa de captação foi descontinuada pelo BCB em jan/2024)*
- KPIs: ICC total (25351); ICC pessoas jurídicas (25352); Spread do ICC (27443); Selic/CDI como referência.
- Gráficos: (a) ICC total e ICC PJ contra a Selic (linhas); (b) Spread do ICC ao longo do tempo.
- **Ligação com a tese:** a página é o mecanismo causal da 4.5 — crédito bancário caro empurra a empresa para o mercado de capitais. A frase de leitura relaciona explicitamente o movimento do ICC ao da participação do mercado de capitais.
- Aviso de escopo: sem fontes autenticadas, o painel não cobre spreads de crédito de debêntures; e a taxa média de captação bancária (SGS 28663) foi descontinuada em jan/2024 — limitações declaradas em Sobre.

### 4.7 Glossário
- Verbetes técnicos em `src/data/glossario.ts`, ordenados alfabeticamente com âncoras; os termos citados nas páginas linkam para cá. Inclui: CDB, RDB, depósito a prazo, LCI, LCA, letra de crédito, letra financeira, debênture, nota comercial, CRI, CRA, securitização, FIDC, cota subordinada, índice de subordinação, estoque vs. emissão, M2/M4, **desintermediação financeira, crédito ampliado, títulos de dívida, securitizados, recursos livres vs. direcionados, ICC, spread do ICC**.

### 4.8 Sobre
- Fontes e URLs; periodicidade; **perímetro exato de cada agregado**; **fórmula de cada indicador com selo cálculo próprio**; a tabela de deltas da seção 0 desta spec, em linguagem de usuário (o que foi investigado e descartado, e por quê); limitações (ausência de ANBIMA; CRI/CRA não separáveis; captação descontinuada; bloco CETIP congelado e arredondado; defasagens de publicação); aviso de painel independente sem vínculo com BCB/CVM/B3; data de processamento.

## 5. Componentes de domínio e padrões editoriais (transversais)

- **`KpiCard`** — valor (mono), rótulo, seta ↗/↘/→ com variação vs. mês anterior (%, ou p.p. quando a grandeza é taxa — sempre marcado), mês de referência. Cores da variação pela paleta de tokens; em série cujo aumento não é "bom" nem "ruim" (estoque), a seta usa cor neutra.
- **`ChartBlock`** — gráfico Recharts + **frase de leitura obrigatória** logo abaixo (uma sentença em português descrevendo o que a figura mostra, gerada no build a partir dos dados, não hardcoded) + link "ver em tabela" que expande o **`DataTable`** com os mesmos dados.
- **Formatação:** R$ em notação compacta consistente (mil/mi/bi/tri) via utilitário único `formatBRL`; percentuais com 1 casa; meses por extenso ("junho de 2026"). Nada de `toLocaleString` avulso espalhado.
- **Blocos congelados** levam marcação visual própria e a data de corte no título — nunca se confundem com séries vivas.
- **Sem valores deflacionados** salvo indicação; comparações longas em valores correntes recebem a ressalva padrão.

## 6. Motor de transformação

Implementar em `src/lib/transforms/` (funções puras, testáveis):

```
varMensal(serie)        = (v_t − v_{t−1}) / v_{t−1}            // % vs. mês anterior
var12m(serie)           = (v_t − v_{t−12}) / v_{t−12}
participacao(x, total)  = x_t / total_t                        // composição
normalizar(serie, un)   = serie em R$ milhões                  // R$ mil → R$ mi quando a unidade exigir
inadFIDC(mes)           = Σ créditos vencidos / Σ carteira      // agregado do mês
subordinacao(mes)       = Σ PL subordinadas / Σ PL total        // ponderado por PL

// Desintermediação (página 4.5) — v2, séries oficiais
mercCap(mes)            = sgs28851_t                            // títulos de dívida emitidos por empresas
credBancario(mes)       = sgs28848_t                            // empréstimos e financiamentos do SFN a empresas
partMercCap(mes)        = mercCap_t / (mercCap_t + credBancario_t)
deltaPart12m(mes)       = partMercCap_t − partMercCap_{t−12}    // em p.p.

// Validação cruzada (gráfico d da 4.5)
partAmpliado(mes)       = sgs28851_t / sgs28846_t               // perímetro do crédito ampliado

// Decomposição do mercado de capitais (página 4.3)
securitizados(mes)      = sgs28851_t − sgs28852_t               // CRI + CRA + direitos creditórios de FIDC
razaoMercCapBanc(mes)   = sgs28851_t / normalizar(sgs27809_t)   // mercado de capitais ÷ captação bancária
```

- Séries com quebra ou mês faltante: propagar `null` (o gráfico interrompe a linha), nunca interpolar silenciosamente.
- `normalizar` é obrigatória em qualquer operação que cruze a família 27xxx (R$ mil) com a família 28xxx (R$ milhões).
- Todos os resultados dessas funções que aparecem no painel levam o selo **cálculo próprio**.

## 7. Testes, evals quantitativos e portão de entrega

Materializa a regra 4 de Karpathy: o deploy só ocorre quando a verificação objetiva passa por inteiro.

### 7.1 Suíte de testes automatizados
- **Unit (Vitest)** para `src/lib/transforms/` (casos com valores esperados fechados, incluindo bordas: série curta, mês nulo, divisão por zero, **cruzamento de unidades**) e para `formatBRL`.
- **Schema (Zod) + metadados:** validação dos JSONs gerados e o teste de metadados da §3.2 (título e unidade conferem com o CKAN; valor-âncora confere com a API de dados).
- **Componente (React Testing Library)** para `KpiCard`, `ChartBlock`, `DataTable` (inclusive a alternância gráfico↔tabela, a marcação %/p.p. e a marcação de bloco congelado).
- **E2E (Playwright)** por página: renderiza com um fixture de dados congelado, confere KPIs contra valores esperados, frase de leitura presente sob cada gráfico, tabela alternativa abre, links do glossário resolvem.
- **Build:** `next build` sem erros, TypeScript estrito.

### 7.2 Evals quantitativos (limiares — todos obrigatórios)
| Eval | Métrica | Limiar |
|------|---------|--------|
| Cobertura de páginas | páginas com teste e2e / total | **100%** |
| Frase de leitura | gráficos com frase de leitura / total | **100%** |
| Tabela alternativa | gráficos com `DataTable` acoplado / total | **100%** |
| Selo cálculo próprio | indicadores derivados com selo e fórmula em Sobre / total | **100%** |
| Fontes rastreáveis | séries registradas em `sources.ts` com teste de metadados (CKAN) e valor-âncora / total | **100%** |
| **Unidades declaradas** | séries com unidade em `sources.ts` conferida contra o CKAN | **100%** |
| **Blocos congelados rotulados** | blocos de série encerrada com data de corte visível e nota em Sobre | **100%** |
| Testes verdes | testes que passam / total | **100%** |
| Cobertura de `lib/transforms` | linhas cobertas | **≥ 80%** |
| Coerência visual | tokens definidos só em `globals.css`; hex ou `font-family` avulsos em componentes | **0 ocorrências** |
| Referência de UI aplicada | nível da hierarquia da §2.1 registrado no README, com justificativa | **sim** |
| Consistência de stack | shadcn + lucide + Recharts com paleta derivada do tema | **sim** |
| Acessibilidade | violações críticas (axe) na home e numa página temática | **0** |

### 7.3 Portão de entrega (delivery gate)
- **GitHub Actions** roda, a cada push/PR: `next build`, testes e a checagem dos evals de 7.2.
- O workflow de dados (cron) só commita se a validação de schema/metadados passar; **deploy só com 100% verde**; branch `main` protegido.
- README traz o comando único que reproduz o portão localmente (`npm run verify`) e o comando do pipeline (`npm run fetch-data`).

### 7.4 Faseamento da construção
Entrega em fatias verticais; **cada fatia fecha com o portão da §7.3 inteiramente verde** antes da seguinte começar.

| Fatia | Conteúdo | Fecha quando |
|-------|----------|--------------|
| **F1** | Fundação (`sources.ts`, teste de metadados CKAN, pipeline SGS, transforms, tokens da skill, `KpiCard`/`ChartBlock`/`DataTable`, CI, Vercel) **+ página 4.5 completa** | 4.5 no ar, evals verdes para ela |
| **F2** | 4.1 Início + 4.2 Captação Bancária (inclui backfill CETIP LCI/LCA) | evals verdes acumulados |
| **F3** | 4.4 FIDCs (inclui backfill CVM 2013–) + 4.6 Custo do Crédito | evals verdes acumulados |
| **F4** | 4.3 Mercado de Capitais + 4.7 Glossário + 4.8 Sobre | **100% dos evals da §7.2** |

## 8. Regras comportamentais para a construção (Karpathy — 12 regras, versão estendida)

Valem para toda tarefa deste projeto, salvo instrução explícita em contrário. O viés é cautela sobre velocidade; para tarefas triviais, use julgamento.

1. **Pense antes de codar.** Não assuma em silêncio, não esconda confusão, exponha trade-offs. Declare premissas; se houver duas leituras, apresente ambas e pergunte; se existir caminho mais simples, diga.
2. **Simplicidade primeiro.** O mínimo de código que resolve o problema. Nada além do pedido: sem abstrações para código de uso único, sem "flexibilidade" não solicitada, sem tratamento de erro para cenários impossíveis. Se 200 linhas puderem ser 50, reescreva.
3. **Mudanças cirúrgicas.** Toque só no necessário; não "melhore" código adjacente nem reformate o que não foi pedido; siga o estilo existente. Remova apenas os órfãos que **suas** mudanças criaram; código morto pré-existente se aponta, não se apaga. Toda linha alterada deve rastrear ao pedido.
4. **Execução orientada a objetivo.** Transforme tarefas em critérios verificáveis. Em tarefas multi-etapa, declare o plano com a verificação de cada passo e itere até os evals da seção 7 ficarem 100% verdes.
5. **Modelo só para julgamento.** Este painel não usa LLM em runtime — e no build também não: roteamento, retries, tratamento de status code e transformações determinísticas são código puro.
6. **Orçamentos não são consultivos.** Respeite limites declarados (tokens, tempo de build, tamanho de bundle). Ao se aproximar do limite, resuma o estado e recomece limpo; sinalizar o estouro > estourar em silêncio.
7. **Exponha conflitos, não os tire na média.** Se dois padrões do código se contradizem, escolha um, justifique e sinalize o outro para limpeza. Código "média" que satisfaz os dois é o pior código.
8. **Leia antes de escrever.** Antes de adicionar código a um arquivo, leia seus exports, o chamador imediato e os utilitários compartilhados (ex.: `formatBRL`, `transforms`).
9. **Testes verificam intenção, não só comportamento.** Cada teste codifica **por que** o comportamento importa (ex.: o teste de `partMercCap` falha se o perímetro da comparação mudar, não apenas se a divisão errar).
10. **Checkpoint a cada passo significativo.** Após cada etapa, resuma o que foi feito, o que está verificado e o que falta. Não continue de um estado que não consegue descrever de volta.
11. **Siga as convenções do código, mesmo discordando.** Conformidade > gosto dentro do repositório. Se uma convenção parecer nociva, sinalize — não a bifurque em silêncio.
12. **Falhe alto.** Se não tem certeza de que algo funcionou, diga explicitamente. "Pipeline concluído" está errado se uma fonte foi pulada; "testes passam" está errado se algum foi skipado. Default: expor a incerteza, nunca escondê-la.

## 9. Resumo das páginas

| # | Página | Fonte principal | Conceito-chave |
|---|--------|-----------------|----------------|
| 1 | Início | agregação de todas | tamanho e composição do estoque privado |
| 2 | Captação Bancária | SGS 27805–27809 + bloco CETIP | funding bancário e efeito tributário LCI/LCA |
| 3 | Mercado de Capitais | SGS 28188–28191, 28851–28852 | debêntures × securitização; *crowding out* pela dívida pública |
| 4 | FIDCs | CVM | risco de crédito estruturado (PL, inadimplência, subordinação) |
| 5 | **Crédito e Desintermediação** | SGS 28846, 28848, 28851 | migração do crédito bancário para o mercado de capitais (página-tese) |
| 6 | Custo do Crédito | SGS 25351, 25352, 27443 | ICC e spread como mecanismo causal da desintermediação |
| 7 | Glossário | — | vocabulário técnico do painel |
| 8 | Sobre | — | metodologia, fórmulas, perímetros e limitações |

## 10. Entrega e publicação
1. `git init`, primeiro commit, push para `https://github.com/JAmerico1898/observatorio-titulos-privados` (já renomeado e público).
2. Resolver a referência de UI pela §2.1 (nível 1 — skill `frontend-design`), materializar os tokens em `globals.css` e registrar o nível no README; configurar os dois workflows (CI de qualidade + cron de dados) e a proteção do branch `main`.
3. Rodar os backfills uma vez localmente (`npm run backfill:fidc`, `npm run backfill:cetip`) e `npm run fetch-data` para materializar `sources.ts` e os JSONs iniciais; conferir o teste de metadados.
4. Conectar à Vercel; deploy contínuo **apenas** do main, condicionado ao CI verde.
5. Conferir a URL de produção contra os evals da §7.2 antes de dar o painel por entregue.
