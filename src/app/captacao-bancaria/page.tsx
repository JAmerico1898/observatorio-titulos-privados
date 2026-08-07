import type { Metadata } from "next";

import { Cabecalho, NotaTecnica, Secao } from "@/components/Cabecalho";
import { ChartBlock } from "@/components/ChartBlock";
import { KpiCard } from "@/components/KpiCard";
import { GraficoAreaEmpilhada, GraficoBarras, GraficoLinhas } from "@/components/charts";
import { cetip, combinar, fonteDe, fonteDeVarias, meta, serie } from "@/lib/dados";
import { formatBRL, formatData, formatPct } from "@/lib/format";
import { fraseComposicao, fraseEstoque, fraseVar12m } from "@/lib/frases";
import { participacao, truncar, ultimo, valorEm, var12m, type Serie } from "@/lib/transforms";

export const metadata: Metadata = {
  title: "Captação Bancária",
  description:
    "Depósitos a prazo, letras de crédito, letras financeiras e outros títulos privados: o funding do balanço bancário.",
};

const INSTRUMENTOS = [
  { chave: "depositosPrazo", slot: 1 },
  { chave: "letrasCredito", slot: 2 },
  { chave: "letrasFinanceiras", slot: 3 },
  { chave: "outrosTitulosPrivados", slot: 4 },
] as const;

export default function Page() {
  const mes = meta.mesReferencia;
  const total = serie("captacaoBancariaTotal");
  const series = Object.fromEntries(INSTRUMENTOS.map((i) => [i.chave, serie(i.chave)])) as Record<
    string,
    Serie
  >;

  const dadosNiveis = combinar(series);
  const dadosVar12 = combinar(
    Object.fromEntries(INSTRUMENTOS.map((i) => [i.chave, var12m(series[i.chave])])),
  );
  const dadosPart = combinar(
    Object.fromEntries(INSTRUMENTOS.map((i) => [i.chave, participacao(series[i.chave], total)])),
  );

  // Bloco congelado: a decomposição LCI × LCA que o SGS não publica.
  const cetipMeses = truncar(
    cetip.meses.map((m) => ({ mes: m.mes, valor: m.lci })),
  ).map((p) => p.mes);
  const dadosCetip = cetip.meses
    .filter((m) => cetipMeses.includes(m.mes))
    .map((m) => ({ mes: m.mes, lci: m.lci, lca: m.lca }));
  const ultimoCetip = cetip.meses.at(-1)!;

  const colunasInstrumentos = INSTRUMENTOS.map((i) => ({
    chave: i.chave,
    rotulo: rotulo(i.chave),
    formato: "brl" as const,
  }));

  return (
    <>
      <Cabecalho
        eyebrow="SGS 27805–27809 · BCB"
        titulo="De onde o banco tira o dinheiro"
        resumo="Todo empréstimo bancário precisa ser financiado. Esta página mede o estoque dos instrumentos que fazem esse funding — e mostra como a isenção de imposto de renda redesenhou a composição da captação na última década."
      />

      <Secao titulo="O estoque por instrumento">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INSTRUMENTOS.map((i) => (
            <KpiCard
              key={i.chave}
              rotulo={rotulo(i.chave)}
              valor={formatBRL(valorEm(series[i.chave], mes))}
              fonte={fonteDe(i.chave)}
              mes={mes}
              variacao={variacaoMensal(series[i.chave])}
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-ink-2">
          Captação bancária total em {formatBRL(valorEm(total, mes))} ({fonteDe("captacaoBancariaTotal")}).
        </p>
      </Secao>

      <Secao titulo="Séries vivas">
        <div className="grid gap-6">
          <ChartBlock
            titulo="Saldo de cada instrumento"
            fonte={fonteDeVarias(...INSTRUMENTOS.map((i) => i.chave))}
            frase={fraseEstoque("a captação bancária total", total)}
            colunas={colunasInstrumentos}
            linhas={dadosNiveis}
          >
            <GraficoLinhas
              dados={dadosNiveis}
              series={INSTRUMENTOS.map((i) => ({
                chave: i.chave,
                rotulo: rotulo(i.chave),
                slot: i.slot,
              }))}
              formato="brlEixo"
            />
          </ChartBlock>

          <ChartBlock
            titulo="Variação em 12 meses por instrumento"
            fonte={fonteDeVarias(...INSTRUMENTOS.map((i) => i.chave))}
            frase={fraseVar12m(
              "a captação bancária",
              INSTRUMENTOS.map((i) => ({ rotulo: rotulo(i.chave), s: series[i.chave] })),
            )}
            indicador="var12mCaptacao"
            colunas={INSTRUMENTOS.map((i) => ({
              chave: i.chave,
              rotulo: rotulo(i.chave),
              formato: "var" as const,
            }))}
            linhas={dadosVar12}
          >
            <GraficoBarras
              dados={dadosVar12}
              series={INSTRUMENTOS.map((i) => ({
                chave: i.chave,
                rotulo: rotulo(i.chave),
                slot: i.slot,
              }))}
              formato="var0"
            />
          </ChartBlock>

          <ChartBlock
            titulo="Participação de cada instrumento na captação total"
            fonte={fonteDeVarias(...INSTRUMENTOS.map((i) => i.chave), "captacaoBancariaTotal")}
            frase={fraseComposicao(
              "a captação bancária",
              INSTRUMENTOS.map((i) => ({
                rotulo: rotulo(i.chave),
                valor: valorEm(series[i.chave], mes),
              })),
              mes,
            )}
            indicador="composicaoCaptacao"
            colunas={INSTRUMENTOS.map((i) => ({
              chave: i.chave,
              rotulo: rotulo(i.chave),
              formato: "pct" as const,
            }))}
            linhas={dadosPart}
          >
            <GraficoAreaEmpilhada
              dados={dadosPart}
              series={INSTRUMENTOS.map((i) => ({
                chave: i.chave,
                rotulo: rotulo(i.chave),
                slot: i.slot,
              }))}
              formato="pct0"
              percentual
            />
          </ChartBlock>
        </div>
      </Secao>

      <Secao titulo="Bloco histórico congelado">
        <ChartBlock
          titulo="LCI × LCA"
          fonte="B3/CETIP · acervo histórico"
          indicador="lciLca"
          congeladoEm={cetip.dataCorte}
          frase={fraseLciLca(ultimoCetip)}
          notaCongelado={`Série histórica da CETIP, encerrada em ${formatData(cetip.dataCorte)}; valores arredondados na origem (2 a 3 algarismos significativos). Não é atualizada pelo pipeline semanal e não deve ser comparada mês a mês com as séries vivas acima.`}
          colunas={[
            { chave: "lci", rotulo: "LCI", formato: "brl" },
            { chave: "lca", rotulo: "LCA", formato: "brl" },
          ]}
          linhas={dadosCetip}
        >
          <GraficoLinhas
            dados={dadosCetip}
            series={[
              { chave: "lci", rotulo: "LCI — lastro imobiliário", slot: 5 },
              { chave: "lca", rotulo: "LCA — lastro do agronegócio", slot: 6 },
            ]}
            formato="brlEixo"
          />
        </ChartBlock>
      </Secao>

      <Secao titulo="Como ler isso">
        <div className="grid gap-4 lg:grid-cols-2">
          <NotaTecnica titulo="A isenção de IR redesenhou a captação">
            <p>
              LCI e LCA são isentas de imposto de renda para o investidor pessoa física. Para uma
              mesma taxa bruta, isso entrega ao poupador um retorno líquido maior que o de um CDB
              equivalente — e permite ao banco captar mais barato em termos líquidos.
            </p>
            <p>
              O efeito aparece na composição: as letras de crédito somavam{" "}
              {formatBRL(valorEm(serie("letrasCredito"), mes))} em estoque, contra{" "}
              {formatBRL(valorEm(serie("depositosPrazo"), mes))} de depósitos a prazo. O bloco
              congelado mostra a repartição entre o lastro imobiliário e o do agronegócio, que o
              SGS publica somada.
            </p>
          </NotaTecnica>

          <NotaTecnica titulo="Sensibilidade ao ciclo de juros">
            <p>
              A captação bancária é remunerada por percentual do CDI. Selic alta torna o
              instrumento atraente e engorda o estoque; Selic em queda empurra o poupador para
              prazo mais longo ou para risco de crédito. É o mesmo ciclo que aparece na página{" "}
              <a className="underline underline-offset-4" href="/custo-do-credito">Custo do Crédito</a>,
              pelo lado do tomador.
            </p>
            <p>
              <strong>Atenção à unidade:</strong> esta família de séries é publicada pelo BCB em
              R$ mil, enquanto as séries de crédito e títulos de dívida vêm em R$ milhões. O
              pipeline normaliza tudo para R$ milhões antes de qualquer soma — sem isso, um erro de
              mil vezes passaria despercebido.
            </p>
          </NotaTecnica>
        </div>
      </Secao>
    </>
  );
}

function rotulo(chave: string): string {
  const mapa: Record<string, string> = {
    depositosPrazo: "Depósitos a prazo (CDB/RDB)",
    letrasCredito: "Letras de crédito (LCI + LCA)",
    letrasFinanceiras: "Letras financeiras",
    outrosTitulosPrivados: "Outros títulos privados",
  };
  return mapa[chave] ?? chave;
}

function variacaoMensal(s: Serie): number | null {
  const u = ultimo(s);
  if (!u) return null;
  const i = s.findIndex((p) => p.mes === u.mes);
  const anterior = s[i - 1]?.valor;
  if (!anterior || u.valor === null) return null;
  return (u.valor - anterior) / anterior;
}

function fraseLciLca(u: { mes: string; lci: number | null; lca: number | null }): string {
  if (u.lci === null || u.lca === null) return "Sem decomposição LCI × LCA no último mês do acervo.";
  const total = u.lci + u.lca;
  const maior = u.lca >= u.lci ? "a LCA" : "a LCI";
  const share = Math.max(u.lci, u.lca) / total;
  return (
    `No encerramento do acervo, o estoque somava ${formatBRL(u.lci)} em LCI e ${formatBRL(u.lca)} ` +
    `em LCA, com ${maior} respondendo por ${formatPct(share)} das letras de crédito.`
  );
}
