/** Verbetes do glossário (spec §4.7). Ordenados alfabeticamente na página. */

export type Verbete = {
  /** Âncora da URL: /glossario#{id} */
  id: string;
  termo: string;
  definicao: string;
};

export const GLOSSARIO: Verbete[] = [
  {
    id: "cdb",
    termo: "CDB — Certificado de Depósito Bancário",
    definicao:
      "Título de captação emitido por banco, com prazo e remuneração pactuados (em geral um percentual do CDI). Para o banco é dívida; para o investidor, aplicação de renda fixa com cobertura do FGC até o limite legal. Compõe, junto com o RDB, a rubrica de depósitos a prazo.",
  },
  {
    id: "cota-subordinada",
    termo: "Cota subordinada",
    definicao:
      "Classe de cota de FIDC que absorve a primeira perda da carteira: só recebe depois de honrados os direitos das cotas sênior. É o colchão de crédito que viabiliza a classificação de risco da cota sênior. Cotas mezanino são subordinadas de prioridade intermediária.",
  },
  {
    id: "cra",
    termo: "CRA — Certificado de Recebíveis do Agronegócio",
    definicao:
      "Título de securitização lastreado em direitos creditórios do agronegócio, emitido por companhia securitizadora. Isento de imposto de renda para pessoa física. Neste painel aparece agregado em securitizados, porque nenhuma fonte pública gratuita o separa do CRI.",
  },
  {
    id: "credito-ampliado",
    termo: "Crédito ampliado",
    definicao:
      "Medida do BCB que soma todas as fontes de financiamento a um setor, não apenas o empréstimo bancário: inclui títulos de dívida, dívida externa e empréstimos de outras sociedades financeiras. É um perímetro mais largo que o do crédito do SFN, e por isso produz participações menores para o mercado de capitais.",
  },
  {
    id: "cri",
    termo: "CRI — Certificado de Recebíveis Imobiliários",
    definicao:
      "Título de securitização lastreado em créditos imobiliários, emitido por companhia securitizadora. Isento de imposto de renda para pessoa física. Como o CRA, aparece aqui dentro do agregado securitizados.",
  },
  {
    id: "debenture",
    termo: "Debênture",
    definicao:
      "Título de dívida de longo prazo emitido por sociedade anônima não financeira para captar diretamente com investidores. Debêntures incentivadas, ligadas a projetos de infraestrutura, gozam de isenção de imposto de renda para pessoa física.",
  },
  {
    id: "deposito-a-prazo",
    termo: "Depósito a prazo",
    definicao:
      "Recurso captado por instituição financeira com vencimento definido, remunerado por taxa pactuada. No SGS é a rubrica que agrega CDB e RDB dentro dos meios de pagamento amplos.",
  },
  {
    id: "desintermediacao",
    termo: "Desintermediação financeira",
    definicao:
      "Deslocamento do financiamento das empresas do balanço dos bancos para o mercado de capitais: em vez de tomar empréstimo, a empresa emite dívida comprada diretamente por investidores. É a tese central deste painel, medida como a participação dos títulos de dívida no financiamento total às empresas.",
  },
  {
    id: "estoque-vs-emissao",
    termo: "Estoque × emissão",
    definicao:
      "Estoque é o saldo devedor em final de período; emissão é o volume colocado no mercado durante o período. Um estoque estável é compatível com emissões intensas compensadas por vencimentos. Todo número deste painel é estoque.",
  },
  {
    id: "fidc",
    termo: "FIDC — Fundo de Investimento em Direitos Creditórios",
    definicao:
      "Fundo cuja carteira é composta majoritariamente por direitos creditórios — recebíveis comerciais, financeiros, do agronegócio, precatórios. Estrutura o risco em classes de cota (sênior, mezanino, subordinada) e é o principal veículo de crédito estruturado no Brasil.",
  },
  {
    id: "icc",
    termo: "ICC — Indicador de Custo do Crédito",
    definicao:
      "Custo médio, em % ao ano, de toda a carteira de crédito em aberto do sistema financeiro, incluindo contratos antigos. Difere da taxa média de operações novas por se mover mais devagar e por descrever o que o tomador efetivamente paga pelo estoque de dívida que carrega.",
  },
  {
    id: "indice-de-subordinacao",
    termo: "Índice de subordinação",
    definicao:
      "Razão entre o patrimônio das cotas subordinadas e o patrimônio total do fundo. Quanto maior, maior a proteção da cota sênior contra perdas da carteira. Neste painel é ponderado por patrimônio e calculado apenas sobre informes que reconciliam com o PL declarado.",
  },
  {
    id: "lca",
    termo: "LCA — Letra de Crédito do Agronegócio",
    definicao:
      "Título de captação bancária lastreado em operações de crédito do agronegócio, isento de imposto de renda para pessoa física. No SGS aparece somado à LCI na rubrica letras de crédito; a separação vem do acervo congelado da CETIP.",
  },
  {
    id: "lci",
    termo: "LCI — Letra de Crédito Imobiliário",
    definicao:
      "Título de captação bancária lastreado em créditos imobiliários, isento de imposto de renda para pessoa física. Mesma observação da LCA quanto à agregação no SGS.",
  },
  {
    id: "letra-de-credito",
    termo: "Letra de crédito",
    definicao:
      "Rubrica do SGS (série 27807) que soma LCI e LCA. A isenção tributária desses instrumentos é o principal fator por trás do crescimento da rubrica na composição da captação bancária.",
  },
  {
    id: "letra-financeira",
    termo: "Letra financeira",
    definicao:
      "Título de captação bancária de prazo mínimo mais longo e valor mínimo elevado, sem cobertura do FGC. Serve ao alongamento do passivo bancário e pode compor capital regulatório quando subordinada.",
  },
  {
    id: "m2-m4",
    termo: "M2 e M4 — agregados monetários",
    definicao:
      "Medidas de meios de pagamento em sentido amplo. M2 acrescenta ao M1 os depósitos de poupança e os títulos privados em poder do público; M4 acrescenta títulos públicos e outras aplicações. As séries de captação bancária deste painel vêm dessa família e são publicadas em R$ mil.",
  },
  {
    id: "nota-comercial",
    termo: "Nota comercial",
    definicao:
      "Título de dívida corporativa de prazo mais curto que a debênture, usado para necessidades de capital de giro. No agregado do BCB aparece junto das debêntures na rubrica de títulos privados emitidos por empresas.",
  },
  {
    id: "rdb",
    termo: "RDB — Recibo de Depósito Bancário",
    definicao:
      "Semelhante ao CDB em função e remuneração, mas intransferível e, em regra, sem resgate antecipado. Compõe a rubrica de depósitos a prazo.",
  },
  {
    id: "recursos-livres-direcionados",
    termo: "Recursos livres × direcionados",
    definicao:
      "Crédito livre é aquele cuja taxa e destinação o banco define; crédito direcionado tem taxa ou destinação fixada por norma (rural, imobiliário, BNDES). A distinção importa porque o custo médio do crédito mistura os dois regimes.",
  },
  {
    id: "securitizacao",
    termo: "Securitização",
    definicao:
      "Conversão de um conjunto de recebíveis em títulos negociáveis, emitidos por um veículo apartado do originador. Permite ao originador transferir risco e liberar balanço; quando a transferência de riscos é substancial, o ativo sai do balanço do cedente (Res. 3.533/CMN).",
  },
  {
    id: "securitizados",
    termo: "Securitizados",
    definicao:
      "Parcela dos títulos de dívida composta por instrumentos de securitização. No perímetro de empresas usado neste painel, é calculada por diferença (SGS 28851 − 28852) e reúne CRI, CRA e os direitos creditórios nas carteiras dos FIDCs.",
  },
  {
    id: "spread-do-icc",
    termo: "Spread do ICC",
    definicao:
      "Diferença entre o ICC e o custo de captação das instituições financeiras. Reúne inadimplência esperada, tributos, compulsório, custo de capital regulatório e margem — a parcela do preço do crédito que o mercado de capitais consegue, em alguma medida, contornar.",
  },
  {
    id: "titulos-de-divida",
    termo: "Títulos de dívida",
    definicao:
      "No vocabulário do crédito ampliado do BCB, o conjunto de instrumentos de dívida emitidos por um setor, dividido em públicos, privados e securitizados. Para empresas, é a série 28851 — o numerador da medida de desintermediação deste painel.",
  },
];
