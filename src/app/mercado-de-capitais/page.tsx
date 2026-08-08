import type { Metadata } from "next";

import { Cabecalho, NotaTecnica, Secao } from "@/components/Cabecalho";
import { ChartBlock } from "@/components/ChartBlock";
import { KpiCard } from "@/components/KpiCard";
import { GraficoLinhas } from "@/components/charts";
import { combinar, fonteDe, fonteDeVarias, meta, serie } from "@/lib/dados";
import { formatBRL, formatMes, formatPct } from "@/lib/format";
import { fraseComposicao, fraseEstoque } from "@/lib/frases";
import { razao, subtrair, ultimo, valorEm, type Serie } from "@/lib/transforms";

export const metadata: Metadata = {
  title: "Mercado de Capitais",
  description:
    "Debêntures, notas comerciais e securitização: o estoque de dívida corporativa emitida no mercado, e o crowding out da dívida pública.",
};

export default function Page() {
  const mes = meta.mesReferencia;

  const mercCapTotal = serie("mercCapEmpresas");
  const debentures = serie("mercCapPrivados");
  const securitizados = subtrair(mercCapTotal, debentures);
  const captacaoBancaria = serie("captacaoBancariaTotal");
  const razaoCanais = razao(mercCapTotal, captacaoBancaria);

  const publicos = serie("titulosPublicos");
  const privados = serie("titulosPrivados");
  const securitizadosTotais = serie("titulosSecuritizados");

  const dadosBracos = combinar({ debentures, securitizados });
  const dadosRazao = combinar({ razaoCanais });
  const dadosDivida = combinar({ publicos, privados, securitizados: securitizadosTotais });

  const vPub = valorEm(publicos, mes);
  const vPriv = valorEm(privados, mes);

  return (
    <>
      <Cabecalho
        titulo="A dívida que a empresa emite"
        resumo="Quando a empresa se financia sem passar pelo banco, ela emite papel. Esta página separa os dois braços desse mercado — dívida direta e securitização — e mede o espaço que a dívida pública ocupa ao lado deles."
      />

      <Secao titulo="O estoque hoje">
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard
            rotulo="Debêntures e notas comerciais"
            valor={formatBRL(valorEm(debentures, mes))}
            fonte={fonteDe("mercCapPrivados")}
            mes={mes}
            variacao={variacaoMensal(debentures)}
          />
          <KpiCard
            rotulo="Securitizados (CRI, CRA e direitos creditórios de FIDC)"
            valor={formatBRL(valorEm(securitizados, mes))}
            fonte={fonteDeVarias("mercCapEmpresas", "mercCapPrivados")}
            mes={mes}
            variacao={variacaoMensal(securitizados)}
            indicador="securitizados"
            nota="28851 − 28852."
          />
          <KpiCard
            rotulo="Mercado de capitais ÷ captação bancária"
            valor={formatPct(valorEm(razaoCanais, mes))}
            fonte={fonteDeVarias("mercCapEmpresas", "captacaoBancariaTotal")}
            mes={mes}
            variacao={variacaoMensal(razaoCanais)}
            tipoVariacao="pp"
            indicador="razaoMercCapBancario"
          />
        </div>
      </Secao>

      <Secao titulo="Os dois braços e o contexto">
        <div className="grid gap-6">
          <ChartBlock
            titulo="Dívida direta e securitização"
            fonte={fonteDeVarias("mercCapPrivados", "mercCapEmpresas")}
            frase={fraseComposicao(
              "o mercado de capitais corporativo",
              [
                { rotulo: "debêntures e notas comerciais", valor: valorEm(debentures, mes) },
                { rotulo: "securitizados", valor: valorEm(securitizados, mes) },
              ],
              mes,
            )}
            indicador="securitizados"
            colunas={[
              { chave: "debentures", rotulo: "Debêntures e notas comerciais", formato: "brl" },
              { chave: "securitizados", rotulo: "Securitizados", formato: "brl" },
            ]}
            linhas={dadosBracos}
          >
            <GraficoLinhas
              dados={dadosBracos}
              series={[
                { chave: "debentures", rotulo: "Debêntures e notas comerciais", slot: 2 },
                { chave: "securitizados", rotulo: "Securitizados", slot: 4 },
              ]}
              formato="brlEixo"
            />
          </ChartBlock>

          <ChartBlock
            titulo="Mercado de capitais dividido pela captação bancária"
            fonte={fonteDeVarias("mercCapEmpresas", "captacaoBancariaTotal")}
            frase={fraseRazao(razaoCanais)}
            indicador="razaoMercCapBancario"
            colunas={[{ chave: "razaoCanais", rotulo: "Razão", formato: "pct" }]}
            linhas={dadosRazao}
          >
            <GraficoLinhas
              dados={dadosRazao}
              series={[{ chave: "razaoCanais", rotulo: "Mercado de capitais ÷ captação bancária", slot: 2 }]}
              formato="pct0"
            />
          </ChartBlock>

          <ChartBlock
            titulo="Títulos de dívida da economia: públicos, privados e securitizados"
            fonte={fonteDeVarias("titulosPublicos", "titulosPrivados", "titulosSecuritizados")}
            frase={fraseCrowdingOut(publicos, privados, mes)}
            colunas={[
              { chave: "publicos", rotulo: "Públicos", formato: "brl" },
              { chave: "privados", rotulo: "Privados", formato: "brl" },
              { chave: "securitizados", rotulo: "Securitizados", formato: "brl" },
            ]}
            linhas={dadosDivida}
          >
            <GraficoLinhas
              dados={dadosDivida}
              series={[
                { chave: "publicos", rotulo: "Títulos públicos", slot: 7 },
                { chave: "privados", rotulo: "Títulos privados", slot: 2 },
                { chave: "securitizados", rotulo: "Securitizados", slot: 4 },
              ]}
              formato="brlEixo"
            />
          </ChartBlock>
        </div>
      </Secao>

      <Secao titulo="Como ler isso">
        <div className="grid gap-4 lg:grid-cols-2">
          <NotaTecnica titulo="Estoque não é emissão">
            <p>
              Todos os números desta página são <strong>saldo em final de período</strong>. Um
              estoque estável pode esconder um ano de emissões intensas compensadas por
              vencimentos e amortizações. Para ler volume emitido no período é preciso outra
              fonte, que o painel não cobre.
            </p>
            <p>
              Valores são correntes, sem deflacionamento — a série começa em 2013 e carrega
              inflação acumulada embutida na comparação de ponta a ponta.
            </p>
          </NotaTecnica>

          <NotaTecnica titulo="O tamanho do Estado no mercado de dívida">
            <p>
              Em {formatMes(mes)} os títulos públicos somavam {formatBRL(vPub)} contra{" "}
              {formatBRL(vPriv)} de títulos privados —{" "}
              {vPub && vPriv ? `${(vPub / vPriv).toFixed(1)}×` : "—"} o tamanho. É o pano de fundo
              da discussão de <em>crowding out</em>: com o Tesouro pagando taxa alta e risco
              soberano, o emissor corporativo precisa oferecer prêmio sobre esse piso para atrair
              o mesmo investidor.
            </p>
            <p>
              Isso não significa que a dívida pública impeça a corporativa de crescer — as duas
              cresceram no período. Significa que o custo de captação corporativa é ancorado por
              ela.
            </p>
          </NotaTecnica>
        </div>

        <div className="mt-4">
          <NotaTecnica titulo="Aviso de escopo — CRI e CRA não são separáveis">
            <p>
              Nenhuma fonte pública e gratuita publica o estoque de CRI e o de CRA em separado. O
              SGS divulga apenas o agregado &ldquo;securitizados&rdquo;, e o acervo histórico de
              balcão da B3, herdado da CETIP, não contém nem CRI, nem CRA, nem debêntures. Separar
              os dois exigiria fonte autenticada (ANBIMA), fora do escopo deste painel.
            </p>
            <p>
              Por isso o KPI &ldquo;securitizados&rdquo; é calculado por diferença (28851 − 28852) e
              agrega CRI, CRA e os direitos creditórios nas carteiras dos FIDCs, detalhados na
              página <a className="underline underline-offset-4" href="/fidcs">FIDCs</a>.
            </p>
          </NotaTecnica>
        </div>
      </Secao>
    </>
  );
}

function variacaoMensal(s: Serie): number | null {
  const u = ultimo(s);
  if (!u) return null;
  const i = s.findIndex((p) => p.mes === u.mes);
  const anterior = s[i - 1]?.valor;
  if (!anterior || u.valor === null) return null;
  return (u.valor - anterior) / anterior;
}

function fraseRazao(r: Serie): string {
  const u = ultimo(r);
  const inicio = r.find((p) => p.valor !== null);
  if (!u || u.valor === null) return "Sem razão calculável para o mês corrente.";
  if (!inicio || inicio.valor === null || inicio.mes === u.mes) {
    return `Em ${formatMes(u.mes)}, o mercado de capitais equivale a ${formatPct(u.valor)} da captação bancária.`;
  }
  return (
    `Em ${formatMes(u.mes)}, o estoque do mercado de capitais equivale a ${formatPct(u.valor)} da ` +
    `captação bancária, contra ${formatPct(inicio.valor)} em ${formatMes(inicio.mes)}. ` +
    `É a mesma migração da página-tese, medida contra o funding do banco em vez do crédito concedido.`
  );
}

function fraseCrowdingOut(publicos: Serie, privados: Serie, mes: string): string {
  const vPub = valorEm(publicos, mes);
  const vPriv = valorEm(privados, mes);
  if (vPub === null || vPriv === null || vPriv === 0) {
    return "Sem comparação disponível entre títulos públicos e privados.";
  }
  return (
    `Em ${formatMes(mes)}, o estoque de títulos públicos (${formatBRL(vPub)}) supera o de títulos ` +
    `privados (${formatBRL(vPriv)}) em ${(vPub / vPriv).toFixed(1)} vezes — a referência de preço ` +
    `contra a qual todo emissor corporativo precisa competir.`
  );
}
