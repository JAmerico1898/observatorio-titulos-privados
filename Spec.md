# Especificação — Painel de Títulos Privados

## Laboratório de Mercado Financeiro | COPPEAD–FGV–UCAM

**Versão:** v1 (pré-implementação)
**Público-alvo:** alunos de MBA e pós-graduação em finanças, com base quantitativa média — tom técnico, sem simplificação excessiva; jargão permitido desde que definido no Glossário.
**Referência estrutural:** `https://tesouro-nacional.vercel.app` (Painel da Dívida Pública Federal) — mesmo padrão editorial: KPI cards com variação mensal, páginas temáticas, frase de leitura sob cada gráfico, tabela alternativa acessível, Glossário e página Sobre com metodologia e selo "cálculo próprio".

---

## 1. Visão geral

O painel monitora o **estoque em R$ dos títulos privados de renda fixa no Brasil** — a captação bancária (CDB/RDB, LCI, LCA, Letras Financeiras), os instrumentos de mercado de capitais (debêntures, CRI, CRA) e o patrimônio dos FIDCs — **e o estoque de crédito bancário do SFN**, respondendo, com dados oficiais e gratuitos: *quanto existe emitido, como esse estoque evolui, como ele se reparte entre funding bancário e mercado de capitais, e a que custo os emissores se financiam*.

A **tese central do painel é a desintermediação financeira**: medir, ao longo do tempo, a migração do crédito às empresas do balanço dos bancos (operações de crédito do SFN) para o mercado de capitais (debêntures, FIDCs, CRI/CRA). A página *Crédito e Desintermediação* (4.5) é o coração analítico do app.

É um painel **somente leitura** (sem login, sem estado de usuário), com dados pré-processados em build — nenhuma chamada a API externa acontece no navegador do aluno.

### Objetivos de aprendizagem
- Distinguir o funding bancário (captação via depósitos e letras) do funding via mercado de capitais (debêntures, securitização), quantificando o tamanho relativo de cada canal.
- Interpretar a evolução do estoque de cada instrumento (nível, variação mensal, variação em 12 meses) e relacioná-la ao ciclo de juros.
- Ler os indicadores estruturais dos FIDCs (PL agregado, inadimplência da carteira, índice de subordinação) como métricas de risco de crédito estruturado.
- Avaliar o custo de captação bancária frente ao CDI a partir das taxas médias divulgadas pelo BCB.
- Quantificar a **desintermediação financeira**: comparar o estoque de crédito bancário PJ com o estoque de dívida corporativa no mercado de capitais (debêntures + FIDC + CRI/CRA) e interpretar a participação crescente do mercado de capitais no crédito ampliado às empresas.

### Premissas assumidas
- **Identidade visual:** definida pela hierarquia da seção 2 (skill `design-taste-frontend` → painel `tesouro-nacional.vercel.app` → inspiração estética). O painel **não** herda os tokens congelados dos laboratórios de cenários; herda apenas o padrão editorial (frases de leitura, tabelas alternativas, selo cálculo próprio).
- **Perímetro da desintermediação:** o lado bancário da comparação é o **saldo de crédito PJ do SFN** (recursos livres + direcionados); o lado mercado de capitais é **debêntures + CRI/CRA (estoque B3) + PL de FIDCs (CVM)**. O agregado de **crédito ampliado ao setor não financeiro** do BCB (que já inclui títulos privados) é usado como série de validação cruzada, com selo próprio. Há dupla contagem potencial entre PL de FIDC e recebíveis originados em bancos — a limitação é declarada em Sobre, não "corrigida" silenciosamente.
- **Períodicidade:** atualização **semanal** via GitHub Actions (cron) é suficiente, dado que as séries centrais são mensais; arquivos B3 diários são agregados para fim de mês.
- **Sem ANBIMA:** conforme decidido, nenhuma fonte com autenticação — logo o painel **não** exibe curvas de crédito/spreads de debêntures; o custo de captação coberto é o bancário (taxas SGS).
- **CRI/CRA** entram pela mesma fonte de estoque registrado da B3 usada para os demais instrumentos de balcão, na página de Mercado de Capitais.

## 2. UI, design e stack

### 2.1 Hierarquia de referência visual (nesta ordem, sem misturar níveis)

1. **Skill `design-taste-frontend`** — se estiver instalada na máquina de build, o construtor **deve** lê-la antes de escrever qualquer componente e seguir suas diretrizes de direção estética, tipografia e composição. (Nota: em ambientes Anthropic, a skill equivalente pode estar publicada como `frontend-design` em `/mnt/skills/public/frontend-design/SKILL.md` — vale como a mesma referência.)
2. **Na ausência da skill:** usar **`https://tesouro-nacional.vercel.app`** como referência de design — replicar sua linguagem visual (densidade editorial, hierarquia tipográfica, cards, navegação, rodapé), inspecionando o site publicado.
3. **Na ausência de acesso ao site:** adotá-lo como **inspiração estética** a partir da descrição desta spec: painel editorial claro, sóbrio, denso em informação e pobre em ornamento; tipografia serifada ou humanista para títulos com forte contraste de peso; números tabulares em destaque; cor usada com parcimônia e significado (variações, selos), nunca decorativa.

Qualquer que seja o nível aplicado, os tokens resultantes (cores, fontes, raios, espaçamentos) são definidos **uma única vez** em `src/app/globals.css` e consumidos via variáveis — nenhum hex ou fonte avulsa em componente. O nível efetivamente aplicado é registrado no README.

### 2.2 Stack (fixo)

- **TypeScript + Next.js (App Router) + React + Tailwind v4 + shadcn/ui (ícones lucide)**; **Recharts** para gráficos, com paleta derivada dos tokens do tema.
- Componentes base shadcn (`Card`, `Button`, `Badge`, `Tabs`) + três componentes de domínio do painel: `KpiCard`, `ChartBlock`, `DataTable` (seção 5).
- Publica no **GitHub + Vercel** (deploy apenas do branch principal, condicionado ao CI verde).

## 3. Arquitetura de dados

### 3.1 Fontes (todas sem autenticação)

| Fonte | Endpoint/arquivo | O que fornece | Frequência |
|-------|------------------|---------------|------------|
| **BCB — SGS** | `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{cod}/dados?formato=json` | Saldos de captação bancária (CDB/RDB, LCI, LCA, Letras Financeiras); **saldo das operações de crédito do SFN** (total, PJ e PF; recursos livres e direcionados); **crédito ampliado ao setor não financeiro** (validação cruzada); taxas médias de captação; CDI e Selic | Mensal (saldos) / diária (taxas) |
| **CVM — Dados Abertos (FIDC)** | `https://dados.cvm.gov.br/dados/FIDC/DOC/INF_MENSAL/DADOS/inf_mensal_fidc_{AAAAMM}.zip` | Informes mensais por fundo: PL, carteira por classe de recebível, créditos vencidos/inadimplentes, cotas sênior × subordinadas | Mensal |
| **B3 — Renda Fixa (balcão)** | Arquivos públicos de **estoque registrado** de renda fixa privada (CSV, URL padronizada por data) | Estoque de debêntures, CRI, CRA e instrumentos bancários registrados, por instrumento | Diária (agregada para fim de mês) |

### 3.2 Regra de fixação de séries e arquivos (obrigatória)

Os **códigos SGS e as URLs exatas dos arquivos B3 não estão fixados nesta spec** e devem ser resolvidos pelo construtor na primeira execução do pipeline, registrados em `src/data/sources.ts` com: código/URL, nome oficial da série, unidade e fonte. Um **teste automatizado de metadados** consulta o SGS (endpoint de metadados) e o cabeçalho dos arquivos B3/CVM e falha se o nome/unidade retornado divergir do registrado — impedindo que um código errado passe silenciosamente. Nenhum código de série aparece hardcoded fora de `sources.ts`.

### 3.3 Pipeline

- `scripts/fetch-data.ts` (Node/TS, sem Python): baixa as fontes, valida schema com **Zod**, transforma e grava JSONs estáticos em `src/data/generated/` (um arquivo por página + um `meta.json` com a data de processamento e o período mais recente de cada fonte).
- **GitHub Actions (cron semanal)** roda o script, commita os JSONs se houver mudança e dispara o deploy na Vercel. Falha de qualquer fonte **não** publica dados parciais: o workflow aborta e mantém a última versão íntegra.
- As páginas são **estáticas** (App Router, geração no build lendo os JSONs). Zero fetch no cliente.
- Todo indicador derivado (não publicado pronto pela fonte) recebe o selo **"cálculo próprio"**, com a fórmula documentada em Sobre — mesmo contrato editorial do painel de referência.

## 4. Páginas

Navegação superior fixa: **Início · Captação Bancária · Mercado de Capitais · FIDCs · Crédito e Desintermediação · Custo de Captação · Glossário · Sobre**. Rodapé idêntico ao padrão do Laboratório (crédito, contato, data de processamento, link para fontes e metodologia).

### 4.1 Início
- Hero: título "O estoque de títulos privados, medido" + subtítulo técnico (uma frase sobre perímetro e fontes).
- **KPI cards (linha 1 — o estoque hoje):** estoque total monitorado (R$ tri, soma dos instrumentos, selo cálculo próprio); estoque bancário (CDB/RDB + LCI + LCA + LF); estoque de mercado de capitais (deb. + CRI + CRA); PL agregado dos FIDCs. Cada card: valor, seta e variação % vs. mês anterior, mês de referência.
- **KPI cards (linha 2 — o crédito):** saldo de crédito PJ do SFN; participação do mercado de capitais no crédito às empresas em % (cálculo próprio); taxa média de captação de CDB (% a.a.); spread captação − CDI em p.p. (cálculo próprio).
- **Gráfico de abertura:** área empilhada do estoque por instrumento, últimos 10 anos.
- Bloco "Por onde começar" com cards-link para as quatro páginas temáticas (padrão do painel de referência).
- Bloco "Como ler este painel": estoque ≠ emissão no ano; valores correntes; todo gráfico tem frase de leitura e tabela; onde diz cálculo próprio.

### 4.2 Captação Bancária
- KPIs: saldo de cada instrumento (CDB/RDB, LCI, LCA, LF) com variação mensal.
- Gráficos: (a) linhas — evolução do saldo de cada instrumento; (b) barras — variação em 12 meses por instrumento; (c) área 100% — participação de cada instrumento na captação total (cálculo próprio).
- Leitura técnica esperada: efeito da isenção de IR de LCI/LCA sobre a composição; sensibilidade da captação ao ciclo da Selic.

### 4.3 Mercado de Capitais
- KPIs: estoque de debêntures, de CRI e de CRA, com variação mensal.
- Gráficos: (a) linhas — estoque por instrumento; (b) barras empilhadas — composição do estoque de securitização (CRI × CRA); (c) razão mercado de capitais / captação bancária ao longo do tempo (cálculo próprio) — o gráfico-tese da página.
- Frase de leitura padrão explicitando que estoque registrado ≠ volume emitido no período.

### 4.4 FIDCs
- KPIs: número de fundos reportantes, PL agregado, % de créditos vencidos sobre a carteira (cálculo próprio), índice de subordinação médio ponderado por PL (cálculo próprio).
- Gráficos: (a) PL agregado mensal; (b) inadimplência agregada da carteira; (c) distribuição do PL por classe de recebível (barras horizontais, último mês).
- Nota metodológica visível: dados de informes mensais CVM, agregados pelo painel; fundos sem informe no mês são excluídos do agregado daquele mês.

### 4.5 Crédito e Desintermediação (página-tese)
- **KPIs:** saldo de crédito PJ do SFN; estoque de dívida corporativa no mercado de capitais (deb. + CRI/CRA + PL FIDC, cálculo próprio); **participação do mercado de capitais no crédito total às empresas** em % (cálculo próprio) — o número-síntese do painel; variação dessa participação em 12 meses, em p.p.
- **Gráficos:** (a) linhas — crédito bancário PJ × dívida no mercado de capitais, em R$, mesma escala; (b) área 100% — participação relativa dos dois canais ao longo do tempo (o gráfico-tese); (c) barras — variação em 12 meses de cada canal, lado a lado, evidenciando quando o mercado de capitais cresce mais rápido que o crédito bancário; (d) linha de validação — participação implícita no **crédito ampliado** do BCB, sobreposta à série de cálculo próprio, com a divergência comentada na frase de leitura.
- **Bloco de leitura técnica** (texto curto, tom MBA): mecanismos da desintermediação — custo regulatório do balanço bancário (capital, compulsório), isenções tributárias de instrumentos incentivados, ciclo de juros e apetite dos fundos de crédito; e o caveat de que FIDCs podem carregar recebíveis originados por bancos (fronteira porosa entre os canais).
- **Nota metodológica visível:** perímetros exatos dos dois lados da comparação e o tratamento da dupla contagem (declarada, não ajustada).

### 4.6 Custo de Captação
- KPIs: taxa média de captação por instrumento disponível no SGS; CDI; spread em p.p. (cálculo próprio).
- Gráficos: (a) taxas de captação × CDI (linhas); (b) spread ao longo do tempo.
- Aviso de escopo: sem fontes autenticadas, o painel não cobre spreads de crédito de debêntures — limitação declarada em Sobre.

### 4.7 Glossário
- Verbetes técnicos (CDB, RDB, LCI, LCA, LF, debênture, CRI, CRA, FIDC, cota subordinada, índice de subordinação, estoque vs. emissão, M2/M4, spread de captação, **desintermediação financeira, crédito ampliado, recursos livres vs. direcionados**), em `src/data/glossario.ts`, ordenados alfabeticamente com âncoras — os termos citados nas páginas linkam para cá.

### 4.8 Sobre
- Fontes e URLs; períodicidade; perímetro exato de cada agregado; **fórmula de cada indicador com selo cálculo próprio**; limitações (ausência de ANBIMA; defasagens de publicação); aviso de painel independente sem vínculo com BCB/CVM/B3; data de processamento.

## 5. Componentes de domínio e padrões editoriais (transversais)

- **`KpiCard`** — valor (mono), rótulo, seta ↗/↘/→ com variação vs. mês anterior (%, ou p.p. quando a grandeza é taxa — sempre marcado), mês de referência. Cores da variação pela paleta `svg-colors` (`green`/`red`/`textMuted`); em série cujo aumento não é "bom" nem "ruim" (estoque), a seta usa cor neutra.
- **`ChartBlock`** — gráfico Recharts + **frase de leitura obrigatória** logo abaixo (uma sentença em português descrevendo o que a figura mostra, gerada no build a partir dos dados, não hardcoded) + link "ver em tabela" que expande o **`DataTable`** com os mesmos dados (acessibilidade e citação em aula).
- **Formatação:** R$ em notação compacta consistente (mil/mi/bi/tri) via utilitário único `formatBRL`; percentuais com 1 casa; meses por extenso ("junho de 2026"). Nada de `toLocaleString` avulso espalhado.
- **Sem valores deflacionados** salvo indicação; comparações longas em valores correntes recebem a ressalva padrão.

## 6. Motor de transformação

Implementar em `src/lib/transforms/` (funções puras, testáveis):

```
varMensal(serie)        = (v_t − v_{t−1}) / v_{t−1}            // % vs. mês anterior
var12m(serie)           = (v_t − v_{t−12}) / v_{t−12}
participacao(x, total)  = x_t / total_t                        // composição
spreadCaptacao(tx, cdi) = tx_t − cdi_t                         // em p.p.
inadFIDC(mes)           = Σ créditos vencidos / Σ carteira     // agregado do mês
subordinacao(mes)       = Σ PL subordinadas / Σ PL total       // ponderado por PL

// Desintermediação (página 4.5)
divMercCap(mes)         = deb_t + cri_t + cra_t + plFIDC_t     // dívida corporativa no mercado de capitais
partMercCap(mes)        = divMercCap_t / (divMercCap_t + credPJ_t)   // % do crédito às empresas
deltaPart12m(mes)       = partMercCap_t − partMercCap_{t−12}   // em p.p.
```

- Séries com quebra ou mês faltante: propagar `null` (o gráfico interrompe a linha), nunca interpolar silenciosamente.
- Todos os resultados dessas funções que aparecem no painel levam o selo **cálculo próprio**.

## 7. Testes, evals quantitativos e portão de entrega

Materializa a regra 4 de Karpathy: o deploy só ocorre quando a verificação objetiva passa por inteiro.

### 7.1 Suíte de testes automatizados
- **Unit (Vitest)** para `src/lib/transforms/` (casos com valores esperados fechados, incluindo bordas: série curta, mês nulo, divisão por zero) e para `formatBRL`.
- **Schema (Zod) + metadados:** validação dos JSONs gerados e o teste de metadados da seção 3.2 (nome/unidade da série confere com `sources.ts`).
- **Componente (React Testing Library)** para `KpiCard`, `ChartBlock`, `DataTable` (inclusive a alternância gráfico↔tabela e a marcação %/p.p.).
- **E2E (Playwright)** por página: renderiza com um fixture de dados congelado, confere KPIs contra valores esperados, frase de leitura presente sob cada gráfico, tabela alternativa abre, links do glossário resolvem.
- **Build:** `next build` sem erros, TypeScript estrito.

### 7.2 Evals quantitativos (limiares — todos obrigatórios)
| Eval | Métrica | Limiar |
|------|---------|--------|
| Cobertura de páginas | páginas com teste e2e / total | **100%** |
| Frase de leitura | gráficos com frase de leitura / total | **100%** |
| Tabela alternativa | gráficos com `DataTable` acoplado / total | **100%** |
| Selo cálculo próprio | indicadores derivados com selo e fórmula em Sobre / total | **100%** |
| Fontes rastreáveis | séries usadas registradas em `sources.ts` com teste de metadados / total | **100%** |
| Testes verdes | testes que passam / total | **100%** |
| Cobertura de `lib/transforms` | linhas cobertas | **≥ 80%** |
| **Coerência visual** | tokens (cores/fontes/raios) definidos só em `globals.css`; hex ou `font-family` avulsos em componentes | **0 ocorrências** |
| Referência de UI aplicada | nível da hierarquia da seção 2.1 registrado no README, com justificativa | **sim** |
| Consistência de stack | shadcn + lucide + Recharts com paleta derivada do tema | **sim** |
| Acessibilidade | violações críticas (axe) na home e numa página temática | **0** |

### 7.3 Portão de entrega (delivery gate)
- **GitHub Actions** roda, a cada push/PR: `next build`, testes e a checagem dos evals de 7.2 (incluindo o diff dos tokens contra o canônico).
- O workflow de dados (cron) só commita se a validação de schema/metadados passar; **deploy só com 100% verde**; branch principal protegido.
- README traz o comando único que reproduz o portão localmente (`npm run verify`) e o comando do pipeline (`npm run fetch-data`).

## 8. Regras comportamentais para a construção (Karpathy — 12 regras, versão estendida)

Valem para toda tarefa deste projeto, salvo instrução explícita em contrário. O viés é cautela sobre velocidade; para tarefas triviais, use julgamento.

1. **Pense antes de codar.** Não assuma em silêncio, não esconda confusão, exponha trade-offs. Declare premissas; se houver duas leituras (ex.: qual série SGS é "saldo de CDB"), apresente ambas e pergunte; se existir caminho mais simples, diga.
2. **Simplicidade primeiro.** O mínimo de código que resolve o problema. Nada além do pedido: sem abstrações para código de uso único, sem "flexibilidade" não solicitada, sem tratamento de erro para cenários impossíveis. Se 200 linhas puderem ser 50, reescreva.
3. **Mudanças cirúrgicas.** Toque só no necessário; não "melhore" código adjacente nem reformate o que não foi pedido; siga o estilo existente. Remova apenas os órfãos que **suas** mudanças criaram; código morto pré-existente se aponta, não se apaga. Toda linha alterada deve rastrear ao pedido.
4. **Execução orientada a objetivo.** Transforme tarefas em critérios verificáveis ("corrigir bug" → "teste que o reproduz, depois fazê-lo passar"). Em tarefas multi-etapa, declare o plano com a verificação de cada passo e itere até os evals da seção 7 ficarem 100% verdes.
5. **Modelo só para julgamento.** Este painel não usa LLM em runtime — e no build também não: roteamento, retries, tratamento de status code e transformações determinísticas são código puro. Se um status code já responde a pergunta, código responde a pergunta.
6. **Orçamentos não são consultivos.** Respeite limites declarados (tokens, tempo de build, tamanho de bundle). Ao se aproximar do limite, resuma o estado e recomece limpo; sinalizar o estouro > estourar em silêncio.
7. **Exponha conflitos, não os tire na média.** Se dois padrões do código se contradizem, escolha um (o mais recente/testado), justifique e sinalize o outro para limpeza. Código "média" que satisfaz os dois é o pior código.
8. **Leia antes de escrever.** Antes de adicionar código a um arquivo, leia seus exports, o chamador imediato e os utilitários compartilhados (ex.: `formatBRL`, `transforms`). Se não entende por que algo está estruturado assim, pergunte antes de acrescentar.
9. **Testes verificam intenção, não só comportamento.** Cada teste codifica **por que** o comportamento importa (ex.: o teste de `partMercCap` falha se o perímetro da comparação mudar, não apenas se a divisão errar). Se um teste não falharia quando a lógica de negócio mudar, a função está errada.
10. **Checkpoint a cada passo significativo.** Após cada etapa, resuma o que foi feito, o que está verificado e o que falta. Não continue de um estado que não consegue descrever de volta; se perder o fio, pare e reestabeleça.
11. **Siga as convenções do código, mesmo discordando.** Conformidade > gosto dentro do repositório. Se uma convenção parecer nociva, sinalize — não a bifurque em silêncio.
12. **Falhe alto.** Se não tem certeza de que algo funcionou, diga explicitamente. "Pipeline concluído" está errado se uma fonte foi pulada; "testes passam" está errado se algum foi skipado. Default: expor a incerteza, nunca escondê-la.

## 9. Resumo das páginas

| # | Página | Fonte principal | Conceito-chave |
|---|--------|-----------------|----------------|
| 1 | Início | agregação de todas | tamanho e composição do estoque privado |
| 2 | Captação Bancária | BCB/SGS | funding bancário e efeito tributário LCI/LCA |
| 3 | Mercado de Capitais | B3 | desintermediação: capitais vs. bancos |
| 4 | FIDCs | CVM | risco de crédito estruturado (PL, inadimplência, subordinação) |
| 5 | **Crédito e Desintermediação** | BCB/SGS + B3 + CVM | migração do crédito bancário para o mercado de capitais (página-tese) |
| 6 | Custo de Captação | BCB/SGS | taxas de captação e spread vs. CDI |
| 7 | Glossário | — | vocabulário técnico do painel |
| 8 | Sobre | — | metodologia, fórmulas e limitações |

## 10. Entrega e publicação
1. `git init`, primeiro commit, criar repositório no GitHub e dar push.
2. Resolver a referência de UI pela hierarquia da seção 2.1, materializar os tokens em `globals.css` e registrar o nível aplicado no README; configurar os dois workflows (CI de qualidade + cron de dados) e a proteção do branch principal.
3. Rodar `npm run fetch-data` uma vez localmente para materializar `sources.ts` e os JSONs iniciais; conferir o teste de metadados.
4. Conectar à Vercel; deploy contínuo **apenas** do main, condicionado ao CI verde.
5. Conferir a URL de produção contra os evals da seção 7.2 antes de dar o painel por entregue.
