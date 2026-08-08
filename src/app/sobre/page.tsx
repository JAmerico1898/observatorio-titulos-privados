import type { Metadata } from "next";

import { Cabecalho, NotaTecnica, Secao } from "@/components/Cabecalho";
import { INDICADORES } from "@/data/indicadores";
import { SERIES, SGS_DADOS, FONTE_CVM_FIDC, FONTE_CETIP } from "@/data/sources";
import { cetip, fidc, meta } from "@/lib/dados";
import { formatData, formatMes } from "@/lib/format";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Fontes, perímetros, fórmulas de cada indicador calculado, o que foi investigado e descartado, e as limitações declaradas do painel.",
};

/** O que a apuração de fontes mostrou, em linguagem de usuário (spec §0 e §4.8). */
const DELTAS = [
  {
    premissa: "A B3 publicaria o estoque registrado de debêntures, CRI e CRA",
    achado:
      "A API pública existe, mas o acervo de balcão herdado da CETIP está congelado em 11/12/2025, não contém debêntures, CRI nem CRA, e traz valores arredondados a 2–3 algarismos significativos. O canal vivo cobre apenas o segmento listado.",
    decisao:
      "A B3 saiu do pipeline recorrente. Sobreviveram dois arquivos congelados — LCI e LCA — baixados uma única vez e versionados no repositório.",
  },
  {
    premissa: "O sistema de séries temporais teria um endpoint de metadados",
    achado:
      "O consultador de metadados do SGS é aplicação com sessão e devolveu erro; a API de dados entrega apenas data e valor, sem nome nem unidade.",
    decisao:
      "O teste de metadados passou a usar o portal de dados abertos do BCB, que devolve título oficial, unidade e periodicidade por código de série.",
  },
  {
    premissa: "O numerador da desintermediação precisaria ser montado à mão",
    achado:
      "O BCB já publica o agregado consolidado — saldo de títulos de dívida emitidos por empresas — e a nota metodológica confirma que ele inclui CRI, CRA e os direitos creditórios nas carteiras dos FIDCs.",
    decisao:
      "O painel usa a série oficial. Somar o patrimônio dos FIDCs por fora passaria a ser dupla contagem contra a parcela securitizados.",
  },
  {
    premissa: "Haveria série viva de taxa média de captação bancária",
    achado:
      "A série existe e está em % ao ano, mas foi descontinuada em janeiro de 2024. Não há substituta viva.",
    decisao:
      "A página de custo passou a medir o ICC e o spread do ICC, ambos vivos e no mesmo mês de referência do resto do painel.",
  },
  {
    premissa: "CRI e CRA poderiam ser exibidos em separado",
    achado:
      "Não existem separados em nenhuma fonte pública e gratuita — nem no SGS, que publica apenas o agregado securitizados, nem no acervo da CETIP.",
    decisao:
      "O painel exibe securitizados agregado e declara a ausência. Separar exigiria fonte autenticada.",
  },
  {
    premissa: "O CDI serviria como taxa de referência",
    achado:
      "O CDI (série 4389) não tem registro no portal de dados abertos do BCB, então não passaria pelo teste de metadados exigido de toda série deste painel.",
    decisao:
      "A referência passou a ser a Selic acumulada no mês, anualizada (série 4189), que tem registro, é mensal e mede o mesmo para o propósito da página de custo.",
  },
];

export default function Page() {
  const processado = new Date(meta.processadoEm);

  return (
    <>
      <Cabecalho
        titulo="Metodologia"
        resumo="Todo número aqui pode ser refeito por quem quiser conferir. Esta página lista as fontes, os perímetros, a fórmula de cada indicador calculado, e — igualmente importante — o que não foi possível medir."
      />

      <Secao titulo="Fontes">
        <div className="overflow-x-auto rounded-[var(--radius)] border border-rule">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Séries e fontes usadas pelo painel</caption>
            <thead className="bg-surface-sunken">
              <tr>
                <th scope="col" className="border-b border-rule px-3 py-2 text-left font-medium text-ink-2">Código</th>
                <th scope="col" className="border-b border-rule px-3 py-2 text-left font-medium text-ink-2">Título oficial</th>
                <th scope="col" className="border-b border-rule px-3 py-2 text-left font-medium text-ink-2">Unidade</th>
                <th scope="col" className="border-b border-rule px-3 py-2 text-left font-medium text-ink-2">Periodicidade</th>
              </tr>
            </thead>
            <tbody>
              {SERIES.map((s) => (
                <tr key={s.codigo} className="even:bg-surface-sunken/40">
                  <td className="tnum px-3 py-1.5 whitespace-nowrap">
                    <a
                      href={SGS_DADOS(s.codigo)}
                      className="underline underline-offset-4"
                      rel="noreferrer noopener"
                    >
                      SGS {s.codigo}
                    </a>
                  </td>
                  <td className="px-3 py-1.5 text-ink-2">{s.titulo}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap text-ink-2">
                    {s.unidade === "milhares-brl"
                      ? "R$ mil"
                      : s.unidade === "milhoes-brl"
                        ? "R$ milhões"
                        : "% a.a."}
                  </td>
                  <td className="px-3 py-1.5 text-ink-2">{s.periodicidade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <NotaTecnica titulo="CVM — informes mensais de FIDC">
            <p>
              Histórico anual de 2013 a 2024 e informes mensais de 2025 em diante, em{" "}
              <a href={FONTE_CVM_FIDC.portal} className="underline underline-offset-4" rel="noreferrer noopener">
                dados.cvm.gov.br
              </a>
              . Cobertura atual: {formatMes(fidc.meses[0].mes)} a {formatMes(fidc.meses.at(-1)!.mes)}.
              Carga única, versionada no repositório; o pipeline semanal não a reexecuta.
            </p>
          </NotaTecnica>
          <NotaTecnica titulo="B3/CETIP — acervo congelado">
            <p>
              {FONTE_CETIP.nome}. Apenas os arquivos de estoque de LCI e LCA, para a decomposição
              que o SGS publica somada. Série encerrada em {formatData(cetip.dataCorte)}, com
              valores arredondados na origem. Carga única, versionada, fora do pipeline semanal.
            </p>
          </NotaTecnica>
        </div>

        <p className="mt-4 max-w-prose text-sm leading-relaxed text-ink-2">
          Toda série do SGS é submetida, a cada execução do pipeline, a dois testes independentes:
          o <strong>título e a unidade</strong> são conferidos contra o portal de dados abertos do
          BCB, e um <strong>valor-âncora</strong> em mês conhecido é conferido contra a API de
          dados. O primeiro pega renomeação e troca de unidade; o segundo pega a troca silenciosa
          do conteúdo de um código. Qualquer divergência aborta a publicação e mantém a última
          versão íntegra.
        </p>
      </Secao>

      <Secao titulo="Perímetros">
        <div className="grid gap-4 lg:grid-cols-2">
          <NotaTecnica titulo="O perímetro da desintermediação">
            <p>
              O <strong>perímetro principal</strong> compara os dois canais domésticos de
              financiamento às empresas: títulos de dívida emitidos por empresas (28851) contra
              empréstimos e financiamentos do SFN a empresas (28848). Ambos vêm da mesma nota
              metodológica do BCB e do mesmo mês de referência.
            </p>
            <p>
              O <strong>perímetro do crédito ampliado</strong> (28846) é usado como validação
              cruzada. Seu denominador inclui dívida externa, empréstimos de outras sociedades
              financeiras e fundos governamentais — por isso produz participação menor para o mesmo
              fenômeno. As duas medidas aparecem sobrepostas na página-tese.
            </p>
            <p>
              Ficam <strong>fora</strong> do denominador principal: dívida externa, fundos
              governamentais e outras sociedades financeiras.
            </p>
          </NotaTecnica>

          <NotaTecnica titulo="Por que os FIDCs não entram no numerador">
            <p>
              Os direitos creditórios das carteiras dos FIDCs já estão contados dentro da série
              28851, na parcela securitizados. Somar o patrimônio líquido dos fundos por fora seria
              contar o mesmo crédito duas vezes. Por isso os FIDCs entram por decomposição, em
              página própria.
            </p>
            <p>
              Também não há dupla contagem contra o crédito bancário: quando a cessão transfere
              substancialmente os riscos, o ativo sai do balanço do cedente (Res. 3.533/CMN).
            </p>
          </NotaTecnica>
        </div>
      </Secao>

      <Secao titulo="Fórmula de cada indicador calculado">
        <p className="mb-4 max-w-prose text-sm leading-relaxed text-ink-2">
          Todo número marcado com o selo <em>cálculo próprio</em> no painel é derivado por uma
          destas fórmulas. O selo não é decorativo: cada ocorrência referencia um item desta lista,
          e a verificação de entrega falha se algum selo não tiver fórmula publicada aqui.
        </p>
        <dl className="divide-y divide-rule rounded-[var(--radius)] border border-rule bg-surface">
          {INDICADORES.map((i) => (
            <div key={i.id} id={`indicador-${i.id}`} className="scroll-mt-24 p-5">
              <dt className="font-display text-lg leading-tight font-bold text-ink">{i.nome}</dt>
              <dd className="mt-1.5 space-y-1.5">
                <p className="tnum text-sm text-ink">{i.formula}</p>
                <p className="max-w-prose text-sm leading-relaxed text-ink-2">{i.nota}</p>
              </dd>
            </div>
          ))}
        </dl>
      </Secao>

      <Secao titulo="O que foi investigado e descartado">
        <p className="mb-4 max-w-prose text-sm leading-relaxed text-ink-2">
          A especificação deste painel foi escrita duas vezes. Na primeira, nenhuma fonte tinha
          sido testada. Ao sondar as três fontes ao vivo, seis premissas não se confirmaram. Elas
          estão aqui para que nenhuma decisão do painel pareça arbitrária depois.
        </p>
        <ol className="space-y-3">
          {DELTAS.map((d) => (
            <li key={d.premissa} className="rounded-[var(--radius)] border border-rule bg-surface p-5">
              <p className="eyebrow">Premissa inicial</p>
              <p className="font-display text-lg leading-tight text-ink">{d.premissa}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="eyebrow">O que a apuração mostrou</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-2">{d.achado}</p>
                </div>
                <div>
                  <p className="eyebrow">Decisão</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-2">{d.decisao}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Secao>

      <Secao titulo="Limitações declaradas">
        <div className="grid gap-4 lg:grid-cols-2">
          <NotaTecnica titulo="O que o painel não cobre">
            <p>
              <strong>Sem fontes autenticadas.</strong> Não há curvas de crédito nem spreads de
              debêntures, que exigiriam ANBIMA.
            </p>
            <p>
              <strong>CRI e CRA não são separáveis</strong> em fonte pública gratuita; aparecem
              agregados em securitizados.
            </p>
            <p>
              <strong>A taxa média de captação bancária foi descontinuada</strong> pelo BCB em
              janeiro de 2024, sem substituta viva.
            </p>
            <p>
              <strong>O bloco LCI × LCA é congelado e arredondado.</strong> Vem de um acervo
              encerrado em {formatData(cetip.dataCorte)}, com valores de 2 a 3 algarismos
              significativos. Não é comparável mês a mês com as séries vivas.
            </p>
          </NotaTecnica>

          <NotaTecnica titulo="Ressalvas de leitura">
            <p>
              <strong>Defasagem de publicação.</strong> Os saldos do BCB saem até quatro semanas
              após o mês de referência; os informes de FIDC da CVM levam cerca de dois meses. O mês
              de referência do painel é o mais recente comum às séries centrais, não o mais recente
              de qualquer série.
            </p>
            <p>
              <strong>Agregados de FIDC dependem de entrega.</strong> Fundos sem informe no mês
              ficam de fora do agregado daquele mês, o que torna os meses mais recentes sensíveis a
              atraso.
            </p>
            {fidc.quebraSubordinacao && (
              <p>
                <strong>
                  Quebra de série no índice de subordinação em{" "}
                  {formatMes(fidc.quebraSubordinacao)}.
                </strong>{" "}
                O salto reflete reclassificação dos rótulos de cota pela CVM na transição para a
                Resolução CVM 175, não movimento de mercado. Os dois trechos não são comparáveis de
                ponta a ponta.
              </p>
            )}
            <p>
              <strong>Valores correntes.</strong> Nada é deflacionado. Comparações de treze anos
              carregam inflação embutida.
            </p>
            <p>
              <strong>Estoque não é emissão.</strong> Todo valor é saldo em final de período.
            </p>
          </NotaTecnica>
        </div>
      </Secao>

      <Secao titulo="Independência e processamento">
        <div className="rounded-[var(--radius)] border border-rule bg-surface p-5">
          <p className="max-w-prose text-sm leading-relaxed text-ink-2">
            Observatório independente, de finalidade educacional, <strong>sem vínculo</strong> com o Banco
            Central do Brasil, a CVM ou a B3. Os dados são públicos e de acesso livre; a
            interpretação é do painel e não representa posição oficial de nenhuma dessas
            instituições.
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="eyebrow">Processado em</dt>
              <dd className="tnum text-ink">
                {processado.toLocaleDateString("pt-BR")}{" "}
                {processado.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Mês de referência</dt>
              <dd className="text-ink">{formatMes(meta.mesReferencia)}</dd>
            </div>
            <div>
              <dt className="eyebrow">Atualização</dt>
              <dd className="text-ink">Mensal</dd>
            </div>
          </dl>
        </div>
      </Secao>
    </>
  );
}
