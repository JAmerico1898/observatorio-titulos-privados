import type { Metadata } from "next";
import Link from "next/link";

import { Cabecalho, NotaTecnica, Secao } from "@/components/Cabecalho";
import { ChartBlock } from "@/components/ChartBlock";
import { KpiCard } from "@/components/KpiCard";
import { GraficoLinhas } from "@/components/charts";
import { combinar, fonteDe, fonteDeVarias, meta, serie } from "@/lib/dados";
import { formatMes, formatPP, formatTaxa } from "@/lib/format";
import { fraseTaxa } from "@/lib/frases";
import { partMercCap, ultimo, valorEm, mesMenos, type Serie } from "@/lib/transforms";

export const metadata: Metadata = {
  title: "Custo do Crédito",
  description:
    "ICC e spread do ICC: o preço que a empresa paga no banco, e o mecanismo econômico que a empurra para o mercado de capitais.",
};

export default function Page() {
  const mes = meta.mesReferencia;

  const iccTotal = serie("iccTotal");
  const iccPJ = serie("iccPJ");
  const spread = serie("spreadICC");
  const selic = serie("selicMensal");

  const dadosICC = combinar({ iccTotal, iccPJ, selic });
  const dadosSpread = combinar({ spread });

  const part = partMercCap(serie("mercCapEmpresas"), serie("credBancarioEmpresas"));

  return (
    <>
      <Cabecalho
        eyebrow="SGS 25351, 25352, 27443 · BCB"
        titulo="O preço de ficar no banco"
        resumo="O Indicador de Custo do Crédito mede quanto custa, na média, a carteira de crédito em aberto do sistema financeiro. É o mecanismo causal da desintermediação: crédito bancário caro empurra a empresa para o mercado."
      />

      <Secao titulo="O custo hoje">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            rotulo="ICC total"
            valor={formatTaxa(valorEm(iccTotal, mes))}
            fonte={fonteDe("iccTotal")}
            mes={mes}
            variacao={variacaoPP(iccTotal)}
            tipoVariacao="pp"
            semantica="menor-melhor"
          />
          <KpiCard
            rotulo="ICC pessoas jurídicas"
            valor={formatTaxa(valorEm(iccPJ, mes))}
            fonte={fonteDe("iccPJ")}
            mes={mes}
            variacao={variacaoPP(iccPJ)}
            tipoVariacao="pp"
            semantica="menor-melhor"
          />
          <KpiCard
            rotulo="Spread do ICC"
            valor={formatTaxa(valorEm(spread, mes))}
            fonte={fonteDe("spreadICC")}
            mes={mes}
            variacao={variacaoPP(spread)}
            tipoVariacao="pp"
            semantica="menor-melhor"
          />
          <KpiCard
            rotulo="Selic acumulada no mês, anualizada"
            valor={formatTaxa(valorEm(selic, mes))}
            fonte={fonteDe("selicMensal")}
            mes={mes}
            variacao={variacaoPP(selic)}
            tipoVariacao="pp"
            nota="Referência de política monetária."
          />
        </div>
      </Secao>

      <Secao titulo="Custo e spread">
        <div className="grid gap-6">
          <ChartBlock
            titulo="ICC total e ICC de pessoas jurídicas contra a Selic"
            fonte={fonteDeVarias("iccTotal", "iccPJ", "selicMensal")}
            frase={fraseTaxa("o ICC de pessoas jurídicas", iccPJ)}
            colunas={[
              { chave: "iccTotal", rotulo: "ICC total", formato: "taxa" },
              { chave: "iccPJ", rotulo: "ICC PJ", formato: "taxa" },
              { chave: "selic", rotulo: "Selic", formato: "taxa" },
            ]}
            linhas={dadosICC}
          >
            <GraficoLinhas
              dados={dadosICC}
              series={[
                { chave: "iccTotal", rotulo: "ICC total", slot: 8 },
                { chave: "iccPJ", rotulo: "ICC pessoas jurídicas", slot: 2 },
                { chave: "selic", rotulo: "Selic (a.a.)", slot: 1, tracejada: true },
              ]}
              formato="taxa"
            />
          </ChartBlock>

          <ChartBlock
            titulo="Spread do ICC"
            fonte={fonteDe("spreadICC")}
            frase={fraseTaxa("o spread do ICC", spread)}
            colunas={[{ chave: "spread", rotulo: "Spread do ICC", formato: "taxa" }]}
            linhas={dadosSpread}
          >
            <GraficoLinhas
              dados={dadosSpread}
              series={[{ chave: "spread", rotulo: "Spread do ICC", slot: 8 }]}
              formato="taxa"
            />
          </ChartBlock>
        </div>
      </Secao>

      <Secao titulo="Como ler isso">
        <div className="grid gap-4 lg:grid-cols-2">
          <NotaTecnica titulo="Por que esta página é o motor da página-tese">
            <p>{fraseMecanismo(iccPJ, part, mes)}</p>
            <p>
              O ICC não é a taxa de uma operação nova: é o custo médio de <strong>toda</strong> a
              carteira em aberto, incluindo contratos antigos. Por isso ele se move mais devagar
              que a Selic e descreve melhor o que a empresa efetivamente paga hoje pelo estoque de
              dívida bancária que carrega.
            </p>
            <p>
              O <strong>spread</strong> é a parcela que não se explica pelo custo de captação do
              banco: inadimplência esperada, tributos, compulsório, custo de capital regulatório e
              margem. É justamente a parte que o mercado de capitais consegue, em alguma medida,
              contornar — e a razão de a migração medida em{" "}
              <Link className="underline underline-offset-4" href="/credito-e-desintermediacao">
                Crédito e Desintermediação
              </Link>{" "}
              ser um fenômeno de preço, não de moda.
            </p>
          </NotaTecnica>

          <NotaTecnica titulo="Aviso de escopo">
            <p>
              O painel <strong>não</strong> cobre spreads de crédito de debêntures nem curvas de
              crédito privado: essas séries exigem fonte autenticada (ANBIMA), fora do escopo de
              dados abertos. Assim, esta página mede o custo de um lado do mercado — o bancário — e
              não a diferença de preço entre os dois canais.
            </p>
            <p>
              A série de <strong>taxa média de captação bancária</strong> (SGS 28663), prevista na
              primeira versão da especificação, foi descontinuada pelo BCB em janeiro de 2024 e não
              tem substituta viva. Por isso a página mede ICC e spread, ambos publicados no mesmo
              mês de referência do resto do painel.
            </p>
            <p>
              A taxa de referência exibida é a <strong>Selic acumulada no mês, anualizada</strong>{" "}
              (SGS 4189), e não o CDI (SGS 4389): o CDI não tem registro no portal de dados abertos
              do BCB e não passaria pelo teste de metadados que todas as séries deste painel
              precisam passar.
            </p>
          </NotaTecnica>
        </div>
      </Secao>
    </>
  );
}

/** Variação vs. mês anterior de uma série que já é taxa: diferença em p.p. */
function variacaoPP(s: Serie): number | null {
  const u = ultimo(s);
  if (!u || u.valor === null) return null;
  const anterior = valorEm(s, mesMenos(u.mes, 1));
  if (anterior === null) return null;
  return (u.valor - anterior) / 100;
}

function fraseMecanismo(iccPJ: Serie, part: Serie, mes: string): string {
  const icc = valorEm(iccPJ, mes);
  const iccBase = valorEm(iccPJ, mesMenos(mes, 12));
  const p = valorEm(part, mes);
  const pBase = valorEm(part, mesMenos(mes, 12));
  if (icc === null || iccBase === null || p === null || pBase === null) {
    return "Sem dados suficientes para relacionar o custo do crédito à participação do mercado de capitais.";
  }
  const dIcc = (icc - iccBase) / 100;
  const dPart = p - pBase;
  const mesmaDirecao = dIcc * dPart > 0;
  return (
    `Nos doze meses até ${formatMes(mes)}, o ICC de pessoas jurídicas variou ${formatPP(dIcc)} e a ` +
    `participação do mercado de capitais no crédito às empresas variou ${formatPP(dPart)} — ` +
    (mesmaDirecao
      ? `os dois se moveram na mesma direção, consistente com a leitura de que crédito bancário mais caro empurra a empresa para o mercado.`
      : `os dois se moveram em direções opostas neste recorte, lembrete de que a relação é estrutural e não mês a mês.`)
  );
}
