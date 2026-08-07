/**
 * Registro dos indicadores derivados — tudo que o painel **calcula** em vez de
 * apenas exibir (spec §3.3 e §7.2).
 *
 * O selo "cálculo próprio" não é um booleano solto no componente: `KpiCard` e
 * `ChartBlock` recebem o `id` de um indicador daqui. Isso torna o eval do
 * portão verificável de verdade — `scripts/check-evals.ts` confere que todo
 * `indicador=` usado nas páginas existe neste registro e que todo indicador do
 * registro tem fórmula publicada em Sobre. Um selo sem fórmula quebra o CI.
 */

export type Indicador = {
  id: string;
  nome: string;
  /** Fórmula, em notação legível, com os códigos das séries de origem. */
  formula: string;
  /** Por que este recorte, e não outro. */
  nota: string;
};

export const INDICADORES: Indicador[] = [
  {
    id: "estoqueMonitorado",
    nome: "Estoque total monitorado",
    formula: "normalizar(SGS 27809) + SGS 28851",
    nota: "Soma a captação bancária ao estoque de títulos de dívida de empresas. A normalização é obrigatória: 27809 vem em R$ mil e 28851 em R$ milhões.",
  },
  {
    id: "partMercCap",
    nome: "Participação do mercado de capitais no crédito às empresas",
    formula: "SGS 28851 ÷ (SGS 28851 + SGS 28848)",
    nota: "O número-síntese do painel. O denominador é a soma dos dois canais domésticos, não o crédito ampliado — perímetro declarado da tese.",
  },
  {
    id: "partCanalBancario",
    nome: "Participação do crédito bancário no crédito às empresas",
    formula: "SGS 28848 ÷ (SGS 28851 + SGS 28848)",
    nota: "Complemento do anterior, pelo mesmo denominador, para que a área empilhada feche em 100% por construção.",
  },
  {
    id: "deltaPart12m",
    nome: "Variação da participação em 12 meses",
    formula: "partMercCap(t) − partMercCap(t−12), em p.p.",
    nota: "Diferença de participações, expressa em pontos percentuais — nunca como variação percentual de um percentual.",
  },
  {
    id: "partAmpliado",
    nome: "Participação sob o perímetro do crédito ampliado",
    formula: "SGS 28851 ÷ SGS 28846",
    nota: "Validação cruzada. Denominador mais largo (inclui dívida externa, outras sociedades financeiras e fundos governamentais), logo participação menor para o mesmo fenômeno.",
  },
  {
    id: "var12mCanais",
    nome: "Variação em 12 meses de cada canal",
    formula: "(v(t) − v(t−12)) ÷ v(t−12), para SGS 28848 e SGS 28851",
    nota: "Mês sem base disponível propaga nulo; a barra some em vez de aparecer como zero.",
  },
  {
    id: "securitizados",
    nome: "Securitizados (perímetro de empresas)",
    formula: "SGS 28851 − SGS 28852",
    nota: "Reúne CRI, CRA e os direitos creditórios nas carteiras dos FIDCs. Nenhuma fonte pública gratuita separa CRI de CRA.",
  },
  {
    id: "razaoMercCapBancario",
    nome: "Mercado de capitais ÷ captação bancária",
    formula: "SGS 28851 ÷ normalizar(SGS 27809)",
    nota: "Mede a mesma migração da página-tese, mas contra o funding do banco em vez do crédito concedido.",
  },
  {
    id: "composicaoCaptacao",
    nome: "Participação de cada instrumento na captação bancária",
    formula: "SGS 2780x ÷ SGS 27809",
    nota: "Todas as parcelas na mesma unidade de origem (R$ mil), então a razão dispensa normalização.",
  },
  {
    id: "var12mCaptacao",
    nome: "Variação em 12 meses por instrumento de captação",
    formula: "(v(t) − v(t−12)) ÷ v(t−12), para SGS 27805–27808",
    nota: "Serve para comparar a velocidade de crescimento entre instrumentos com estoques de ordens diferentes.",
  },
  {
    id: "composicaoEstoque",
    nome: "Composição do estoque monitorado por instrumento",
    formula: "Empilhamento de SGS 27805–27808 normalizados, SGS 28852 e securitizados",
    nota: "Mistura duas famílias de séries com unidades diferentes — só é somável depois da normalização para R$ milhões.",
  },
  {
    id: "plFidc",
    nome: "Patrimônio líquido agregado dos FIDCs",
    formula: "Σ TAB_IV_A_VL_PL de todos os informes do mês",
    nota: "Fundos sem informe no mês ficam de fora do agregado daquele mês.",
  },
  {
    id: "inadFidc",
    nome: "Inadimplência agregada da carteira dos FIDCs",
    formula:
      "Σ (TAB_I2A2 + TAB_I2B2) ÷ Σ (TAB_I2A_VL_DIRCRED_RISCO + TAB_I2B_VL_DIRCRED_SEM_RISCO)",
    nota: "Numerador é crédito vencido e não pago. Crédito vencido porém adimplente (TAB_I2A1/I2B1) fica de fora.",
  },
  {
    id: "subordinacaoFidc",
    nome: "Índice de subordinação dos FIDCs",
    formula: "Σ PL de cotas subordinadas ÷ Σ PL total, sobre informes reconciliados",
    nota: "Só entram informes cujas cotas (quantidade × valor) batem com o PL declarado pelo próprio fundo dentro de 5%. A cobertura alcançada aparece na tabela de cada mês.",
  },
  {
    id: "classesFidc",
    nome: "Carteira dos FIDCs por classe de recebível",
    formula: "Σ TAB_II_x por classe, sete maiores nomeadas e o restante em “Outras classes”",
    nota: "A paleta categórica tem oito posições e não se recicla; agrupar o resto evita repetir cor entre categorias distintas.",
  },
  {
    id: "lciLca",
    nome: "Decomposição LCI × LCA",
    formula: "Último dia útil de cada mês do acervo B3/CETIP, convertido para R$ milhões",
    nota: "Bloco congelado. Série encerrada em 11/12/2025 e arredondada na origem — não comparável mês a mês com as séries vivas.",
  },
];

export const INDICADORES_POR_ID = new Map(INDICADORES.map((i) => [i.id, i]));

export type IndicadorId = string;
