import type { Metadata } from "next";

import { Cabecalho, NotaTecnica, Secao } from "@/components/Cabecalho";
import { ChartBlock } from "@/components/ChartBlock";
import { KpiCard } from "@/components/KpiCard";
import { GraficoAreaEmpilhada, GraficoBarras, GraficoLinhas } from "@/components/charts";
import { combinar, fonteDe, fonteDeVarias, meta, serie } from "@/lib/dados";
import { formatBRL, formatMes, formatPct, formatPP, formatVar } from "@/lib/format";
import { fraseComparacao, frasePart } from "@/lib/frases";
import {
  cruzamento,
  deltaPart12m,
  partAmpliado,
  partMercCap,
  ultimo,
  valorEm,
  var12m,
  type Serie,
} from "@/lib/transforms";

export const metadata: Metadata = {
  title: "Crédito e Desintermediação",
  description:
    "A migração do crédito às empresas do balanço dos bancos para o mercado de capitais, medida mês a mês desde 2013.",
};

export default function Page() {
  const mercCap = serie("mercCapEmpresas");
  const credBanc = serie("credBancarioEmpresas");
  const ampliado = serie("creditoAmpliadoEmpresas");

  const part = partMercCap(mercCap, credBanc);
  const partAmpl = partAmpliado(mercCap, ampliado);
  const dPart = deltaPart12m(part);
  const cruzou = cruzamento(mercCap, credBanc);

  const mes = meta.mesReferencia;
  const vMercCap = valorEm(mercCap, mes);
  const vCredBanc = valorEm(credBanc, mes);
  const vPart = valorEm(part, mes);
  const vDPart = valorEm(dPart, mes);

  const varMesA = (s: Serie) => {
    const u = ultimo(s);
    if (!u) return null;
    const anterior = s[s.findIndex((p) => p.mes === u.mes) - 1]?.valor ?? null;
    if (anterior === null || u.valor === null || anterior === 0) return null;
    return (u.valor - anterior) / anterior;
  };

  // (a) níveis
  const dadosNiveis = combinar({ credBanc, mercCap });
  // (b) participação relativa — soma 1 por construção
  const dadosPart = combinar({ credBanc: partCanalBancario(credBanc, mercCap), mercCap: part });
  // (c) variação em 12 meses lado a lado
  const dadosVar12 = combinar({ credBanc: var12m(credBanc), mercCap: var12m(mercCap) });
  // (d) validação cruzada de perímetro
  const dadosValidacao = combinar({ part, partAmpl });

  return (
    <>
      <Cabecalho
        eyebrow="Página-tese · SGS 28846, 28848, 28851 · BCB"
        titulo="O crédito às empresas mudou de balcão"
        resumo="O estoque de títulos de dívida emitidos por empresas ultrapassou o saldo de empréstimos bancários a empresas. Esta página mede quando isso aconteceu, em que velocidade, e por que a magnitude do fenômeno depende de onde se traça o perímetro."
      />

      <Secao titulo="O estoque hoje">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            rotulo="Empréstimos e financiamentos do SFN a empresas"
            valor={formatBRL(vCredBanc)}
            fonte={fonteDe("credBancarioEmpresas")}
            mes={mes}
            variacao={varMesA(credBanc)}
          />
          <KpiCard
            rotulo="Títulos de dívida emitidos por empresas"
            valor={formatBRL(vMercCap)}
            fonte={fonteDe("mercCapEmpresas")}
            mes={mes}
            variacao={varMesA(mercCap)}
          />
          <KpiCard
            rotulo="Participação do mercado de capitais no crédito às empresas"
            valor={formatPct(vPart)}
            fonte={fonteDeVarias("mercCapEmpresas", "credBancarioEmpresas")}
            mes={mes}
            variacao={varMesA(part)}
            tipoVariacao="pp"
            indicador="partMercCap"
            nota="Denominador: soma dos dois canais domésticos."
          />
          <KpiCard
            rotulo="Variação dessa participação em 12 meses"
            valor={formatPP(vDPart)}
            fonte={fonteDeVarias("mercCapEmpresas", "credBancarioEmpresas")}
            mes={mes}
            indicador="deltaPart12m"
          />
        </div>
      </Secao>

      <Secao titulo="Os dois canais">
        <div className="grid gap-6">
          <ChartBlock
            titulo="Crédito bancário e mercado de capitais, em R$"
            fonte={fonteDeVarias("credBancarioEmpresas", "mercCapEmpresas")}
            frase={fraseComparacao(
              "o mercado de capitais",
              mercCap,
              "o crédito bancário",
              credBanc,
              cruzou,
            )}
            colunas={[
              { chave: "credBanc", rotulo: "Crédito bancário", formato: "brl" },
              { chave: "mercCap", rotulo: "Mercado de capitais", formato: "brl" },
            ]}
            linhas={dadosNiveis}
          >
            <GraficoLinhas
              dados={dadosNiveis}
              series={[
                { chave: "credBanc", rotulo: "Crédito bancário a empresas", slot: 1 },
                { chave: "mercCap", rotulo: "Mercado de capitais (empresas)", slot: 2 },
              ]}
              formato="brlEixo"
              marcarMes={cruzou}
              rotuloMarca="cruzamento"
            />
          </ChartBlock>

          <ChartBlock
            titulo="Participação relativa dos dois canais"
            fonte={fonteDeVarias("credBancarioEmpresas", "mercCapEmpresas")}
            frase={frasePart(part, partAmpl)}
            indicador="partCanalBancario"
            colunas={[
              { chave: "credBanc", rotulo: "Crédito bancário", formato: "pct" },
              { chave: "mercCap", rotulo: "Mercado de capitais", formato: "pct" },
            ]}
            linhas={dadosPart}
          >
            <GraficoAreaEmpilhada
              dados={dadosPart}
              series={[
                { chave: "credBanc", rotulo: "Crédito bancário a empresas", slot: 1 },
                { chave: "mercCap", rotulo: "Mercado de capitais (empresas)", slot: 2 },
              ]}
              formato="pct0"
              percentual
            />
          </ChartBlock>

          <ChartBlock
            titulo="Variação em 12 meses, canal a canal"
            fonte={fonteDeVarias("credBancarioEmpresas", "mercCapEmpresas")}
            frase={fraseVariacaoCanais(credBanc, mercCap)}
            indicador="var12mCanais"
            colunas={[
              { chave: "credBanc", rotulo: "Crédito bancário", formato: "var" },
              { chave: "mercCap", rotulo: "Mercado de capitais", formato: "var" },
            ]}
            linhas={dadosVar12}
          >
            <GraficoBarras
              dados={dadosVar12}
              series={[
                { chave: "credBanc", rotulo: "Crédito bancário a empresas", slot: 1 },
                { chave: "mercCap", rotulo: "Mercado de capitais (empresas)", slot: 2 },
              ]}
              formato="var0"
            />
          </ChartBlock>

          <ChartBlock
            titulo="A mesma pergunta sob dois perímetros"
            fonte={fonteDeVarias("mercCapEmpresas", "credBancarioEmpresas", "creditoAmpliadoEmpresas")}
            frase={frasePerimetros(part, partAmpl)}
            indicador="partAmpliado"
            colunas={[
              { chave: "part", rotulo: "Dois canais domésticos", formato: "pct" },
              { chave: "partAmpl", rotulo: "Crédito ampliado", formato: "pct" },
            ]}
            linhas={dadosValidacao}
          >
            <GraficoLinhas
              dados={dadosValidacao}
              series={[
                { chave: "part", rotulo: "Sobre os dois canais domésticos", slot: 2 },
                { chave: "partAmpl", rotulo: "Sobre o crédito ampliado a empresas", slot: 7, tracejada: true },
              ]}
              formato="pct0"
            />
          </ChartBlock>
        </div>
      </Secao>

      <Secao titulo="Como ler isso">
        <div className="grid gap-4 lg:grid-cols-2">
          <NotaTecnica titulo="Os mecanismos da desintermediação">
            <p>
              A migração não é preferência estética do tesoureiro. Ela responde a preços
              relativos. O balanço bancário carrega <strong>custo regulatório</strong> — capital
              exigido por Basileia, compulsório sobre depósitos, provisionamento — que o mercado
              de capitais não carrega da mesma forma. Esse custo aparece no spread cobrado da
              empresa, medido na página <a className="underline underline-offset-4" href="/custo-do-credito">Custo do Crédito</a>.
            </p>
            <p>
              Do lado da demanda pelo papel, a <strong>isenção tributária</strong> de
              instrumentos incentivados (debêntures de infraestrutura, CRI, CRA) baixa a taxa que
              o emissor precisa pagar para atrair o investidor pessoa física. E o crescimento dos
              fundos de crédito privado criou um comprador natural para o papel corporativo que
              não existia com essa profundidade há dez anos.
            </p>
            <p>
              O <strong>ciclo de juros</strong> modula tudo isso: Selic alta encarece o crédito
              bancário e, ao mesmo tempo, torna o papel indexado ao CDI atraente para o
              investidor — os dois efeitos empurram na mesma direção.
            </p>
          </NotaTecnica>

          <NotaTecnica titulo="A fronteira entre os canais é porosa">
            <p>
              O painel mede dois canais como se fossem separados, mas eles se tocam. Um FIDC que
              compra recebíveis <em>originados por um banco</em> aparece no mercado de capitais,
              embora o crédito tenha nascido na agência. A cessão com transferência substancial
              de riscos baixa o ativo do balanço do cedente (Res. 3.533/CMN), então não há dupla
              contagem — mas há uma reclassificação que o número, sozinho, não conta.
            </p>
            <p>
              Por isso a página <a className="underline underline-offset-4" href="/fidcs">FIDCs</a>{" "}
              trata os fundos por <strong>decomposição</strong>, e não como parcela somada: os
              direitos creditórios das carteiras já estão dentro do agregado oficial do BCB, na
              parcela &ldquo;securitizados&rdquo;. Somá-los por fora seria contar duas vezes.
            </p>
          </NotaTecnica>
        </div>

        <div className="mt-4">
          <NotaTecnica titulo="Nota metodológica — os dois perímetros">
            <p>
              O <strong>perímetro principal</strong> compara os dois canais domésticos:
              participação = 28851 ÷ (28851 + 28848). É o mais restrito e o mais nítido — os dois
              lados vêm da mesma nota metodológica do BCB, no mesmo mês de referência, e a soma
              é um total interpretável (&ldquo;o financiamento doméstico às empresas&rdquo;).
            </p>
            <p>
              O <strong>perímetro do crédito ampliado</strong> usa 28851 ÷ 28846. O denominador
              é maior porque inclui dívida externa, empréstimos de outras sociedades financeiras
              e fundos governamentais. A participação cai, mas a inclinação da curva permanece —
              é isso que a sobreposição do quarto gráfico mostra. A divergência entre as duas
              linhas é a medida de quanto do financiamento às empresas escapa dos dois canais
              domésticos.
            </p>
            <p>
              Ficam <strong>fora</strong> do denominador principal: dívida externa, fundos
              governamentais e outras sociedades financeiras. Todos os valores são correntes, sem
              deflacionamento — comparações de dez anos carregam inflação embutida.
            </p>
          </NotaTecnica>
        </div>
      </Secao>
    </>
  );
}

/**
 * Participação do canal bancário — o complemento, pela mesma fórmula e com o
 * mesmo denominador, para que a área empilhada feche em 100% por construção.
 */
function partCanalBancario(credBanc: Serie, mercCap: Serie): Serie {
  return partMercCap(credBanc, mercCap);
}

function fraseVariacaoCanais(credBanc: Serie, mercCap: Serie): string {
  const u = ultimo(mercCap);
  if (!u) return "Sem variação calculável.";
  const vb = valorEm(var12m(credBanc), u.mes);
  const vm = valorEm(var12m(mercCap), u.mes);
  if (vb === null || vm === null) return "Sem variação em doze meses para o mês corrente.";
  return (
    `Nos doze meses até ${formatMes(u.mes)}, o mercado de capitais cresceu ${formatVar(vm)} ` +
    `e o crédito bancário ${formatVar(vb)} — uma diferença de ${formatPP(vm - vb)} a favor do ` +
    `mercado de capitais, que é o motor da mudança de participação.`
  );
}

function frasePerimetros(part: Serie, partAmpl: Serie): string {
  const u = ultimo(part);
  if (!u || u.valor === null) return "Sem participação calculável.";
  const a = valorEm(partAmpl, u.mes);
  if (a === null) return "Sem medida sob o perímetro do crédito ampliado.";
  return (
    `Em ${formatMes(u.mes)}, o mesmo fenômeno mede ${formatPct(u.valor)} sob os dois canais ` +
    `domésticos e ${formatPct(a)} sob o crédito ampliado — uma distância de ${formatPP(u.valor - a)}. ` +
    `As duas linhas sobem juntas: a escolha do perímetro muda a magnitude, não a direção.`
  );
}
