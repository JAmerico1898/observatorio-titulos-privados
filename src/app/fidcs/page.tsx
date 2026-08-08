import type { Metadata } from "next";
import Link from "next/link";

import { Cabecalho, NotaTecnica, Secao } from "@/components/Cabecalho";
import { ChartBlock } from "@/components/ChartBlock";
import { KpiCard } from "@/components/KpiCard";
import { GraficoBarrasHorizontais, GraficoLinhas } from "@/components/charts";
import { fidc, serie } from "@/lib/dados";
import { formatBRL, formatInteiro, formatMes, formatPct } from "@/lib/format";
import { fraseComposicao, fraseEstoque } from "@/lib/frases";
import { inadFIDC, subordinacao, subtrair, ultimo, type Serie } from "@/lib/transforms";

export const metadata: Metadata = {
  title: "FIDCs",
  description:
    "Patrimônio líquido, inadimplência da carteira e índice de subordinação dos fundos de investimento em direitos creditórios.",
};

export default function Page() {
  const meses = fidc.meses;
  const u = meses.at(-1)!;

  const sPL: Serie = meses.map((m) => ({ mes: m.mes, valor: m.plTotal }));
  const sInad: Serie = meses.map((m) => ({
    mes: m.mes,
    valor: inadFIDC(m.creditosVencidos, m.carteiraDireitosCreditorios),
  }));
  const sSub: Serie = meses.map((m) => ({
    mes: m.mes,
    valor: subordinacao(m.plSubordinada, m.plSenior + m.plSubordinada),
  }));

  const inadAtual = inadFIDC(u.creditosVencidos, u.carteiraDireitosCreditorios);
  const subAtual = subordinacao(u.plSubordinada, u.plSenior + u.plSubordinada);

  // O braço "securitizados" do agregado oficial, onde os direitos creditórios
  // destas carteiras já estão contados.
  const securitizados = subtrair(serie("mercCapEmpresas"), serie("mercCapPrivados"));
  const uSec = ultimo(securitizados);

  const dadosPL = meses.map((m) => ({ mes: m.mes, pl: m.plTotal }));
  const dadosInad = meses.map((m) => ({
    mes: m.mes,
    inad: inadFIDC(m.creditosVencidos, m.carteiraDireitosCreditorios),
  }));
  const dadosSub = meses.map((m) => ({
    mes: m.mes,
    sub: subordinacao(m.plSubordinada, m.plSenior + m.plSubordinada),
    cobertura: m.cobertura,
  }));

  const classes = fidc.classesUltimoMes.map((c, i) => ({
    rotulo: c.rotulo,
    valor: c.valor,
    slot: i + 1,
  }));

  const notaQuebra = fidc.quebraSubordinacao
    ? `Atenção à quebra em ${formatMes(fidc.quebraSubordinacao)}: o salto no índice não é movimento de mercado, ` +
      `é a CVM reclassificando os rótulos das cotas na transição para a Resolução CVM 175. ` +
      `Os dois trechos não são diretamente comparáveis.`
    : undefined;

  return (
    <>
      <Cabecalho
        titulo="FIDCs, por dentro"
        resumo="Os fundos de investimento em direitos creditórios são a engenharia do crédito estruturado brasileiro. Esta página mede o tamanho, a qualidade da carteira e o colchão de subordinação que protege o cotista sênior."
      />

      <Secao titulo="O agregado hoje">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            rotulo="Informes recebidos no mês"
            valor={formatInteiro(u.fundos)}
            fonte="CVM · informe mensal"
            mes={u.mes}
            nota="Fundos e classes que entregaram informe."
          />
          <KpiCard
            rotulo="Patrimônio líquido agregado"
            valor={formatBRL(u.plTotal)}
            fonte="CVM · Tabela IV"
            mes={u.mes}
            variacao={variacaoMensal(sPL)}
          />
          <KpiCard
            rotulo="Créditos vencidos sobre a carteira"
            valor={formatPct(inadAtual, 2)}
            fonte="CVM · Tabela I"
            mes={u.mes}
            indicador="inadFidc"
            semantica="menor-melhor"
            variacao={variacaoMensal(sInad)}
            tipoVariacao="pp"
          />
          <KpiCard
            rotulo="Índice de subordinação"
            valor={formatPct(subAtual)}
            fonte="CVM · Tabela X.2"
            mes={u.mes}
            indicador="subordinacaoFidc"
            nota={`Cobre ${formatPct(u.cobertura, 0)} do PL — só informes cujas cotas reconciliam com o PL declarado.`}
          />
        </div>
      </Secao>

      <Secao titulo="Tamanho, risco e estrutura">
        <div className="grid gap-6">
          <ChartBlock
            titulo="Patrimônio líquido agregado"
            fonte="CVM · Tabela IV"
            frase={fraseEstoque("o patrimônio líquido agregado dos FIDCs", sPL)}
            indicador="plFidc"
            colunas={[{ chave: "pl", rotulo: "PL agregado", formato: "brl" }]}
            linhas={dadosPL}
          >
            <GraficoLinhas
              dados={dadosPL}
              series={[{ chave: "pl", rotulo: "PL agregado", slot: 3 }]}
              formato="brlEixo"
            />
          </ChartBlock>

          <ChartBlock
            titulo="Inadimplência agregada da carteira"
            fonte="CVM · Tabela I"
            frase={fraseInadimplencia(sInad)}
            indicador="inadFidc"
            colunas={[{ chave: "inad", rotulo: "Créditos vencidos ÷ carteira", formato: "pct" }]}
            linhas={dadosInad}
          >
            <GraficoLinhas
              dados={dadosInad}
              series={[{ chave: "inad", rotulo: "Créditos vencidos ÷ carteira", slot: 8 }]}
              formato="pct0"
            />
          </ChartBlock>

          <ChartBlock
            titulo="Índice de subordinação"
            fonte="CVM · Tabela X.2"
            frase={fraseSubordinacao(sSub, fidc.quebraSubordinacao)}
            indicador="subordinacaoFidc"
            notaCongelado={notaQuebra}
            colunas={[
              { chave: "sub", rotulo: "Subordinação", formato: "pct" },
              { chave: "cobertura", rotulo: "Cobertura do cálculo", formato: "pct" },
            ]}
            linhas={dadosSub}
          >
            <GraficoLinhas
              dados={dadosSub}
              series={[{ chave: "sub", rotulo: "PL subordinado ÷ PL total", slot: 7 }]}
              formato="pct0"
              marcarMes={fidc.quebraSubordinacao}
              rotuloMarca="quebra de série"
            />
          </ChartBlock>

          <ChartBlock
            titulo="Carteira por classe de recebível"
            fonte="CVM · Tabela II"
            frase={fraseComposicao("a carteira agregada dos FIDCs", fidc.classesUltimoMes, fidc.mesClasses)}
            indicador="classesFidc"
            colunas={[{ chave: "valor", rotulo: "Carteira", formato: "brl" }]}
            linhas={classes.map((c) => ({ mes: c.rotulo, valor: c.valor }))}
          >
            <GraficoBarrasHorizontais dados={classes} formato="brlEixo" />
          </ChartBlock>
        </div>
      </Secao>

      <Secao titulo="Como ler isso">
        <div className="grid gap-4 lg:grid-cols-2">
          <NotaTecnica titulo="Onde os FIDCs entram na tese do painel">
            <p>
              O PL agregado dos FIDCs ({formatBRL(u.plTotal)}) e o braço
              &ldquo;securitizados&rdquo; do agregado oficial do BCB (
              {formatBRL(uSec?.valor)}) medem realidades sobrepostas: os direitos creditórios das
              carteiras destes fundos <strong>já estão contados</strong> dentro da série 28851, na
              parcela securitizados.
            </p>
            <p>
              Por isso o painel <strong>decompõe</strong> os FIDCs em vez de somá-los ao numerador
              da desintermediação. Somar o PL por fora seria contar o mesmo crédito duas vezes.
              Também não há dupla contagem contra o crédito bancário: a cessão com transferência
              substancial de riscos baixa o ativo do balanço do cedente (Res. 3.533/CMN).
            </p>
            <p>
              Os dois números não são iguais, e não deveriam ser: o PL inclui caixa, títulos
              públicos e cotas de outros fundos, enquanto o agregado do BCB conta apenas os
              direitos creditórios. Ver{" "}
              <Link className="underline underline-offset-4" href="/credito-e-desintermediacao">
                Crédito e Desintermediação
              </Link>
              .
            </p>
          </NotaTecnica>

          <NotaTecnica titulo="Nota metodológica">
            <p>
              Os agregados vêm dos informes mensais entregues à CVM e são somados pelo painel.
              Fundos sem informe no mês <strong>não entram</strong> no agregado daquele mês — o que
              torna a série sensível a atraso de entrega, sobretudo nos meses mais recentes.
            </p>
            <p>
              A <strong>inadimplência</strong> é a razão entre créditos vencidos e não pagos e a
              carteira de direitos creditórios (com e sem risco de recompra). Créditos vencidos
              porém adimplentes ficam fora do numerador.
            </p>
            <p>
              O <strong>índice de subordinação</strong> agrega somente os informes cujas cotas
              (quantidade × valor) reconciliam com o PL que o próprio fundo declarou, dentro de 5%.
              Sem esse filtro, erros pontuais de digitação na origem — houve um informe reportando
              cota de R$ 103 bilhões — distorceriam o agregado em ordens de magnitude. A cobertura
              alcançada aparece na tabela de cada mês, e é de {formatPct(u.cobertura, 0)} no mês
              corrente.
            </p>
          </NotaTecnica>
        </div>
      </Secao>
    </>
  );
}

function variacaoMensal(s: Serie): number | null {
  if (s.length < 2) return null;
  const atual = s.at(-1)?.valor;
  const anterior = s.at(-2)?.valor;
  if (atual === null || atual === undefined || !anterior) return null;
  return (atual - anterior) / anterior;
}

function fraseInadimplencia(s: Serie): string {
  const u = ultimo(s);
  if (!u || u.valor === null) return "Sem inadimplência calculável para o mês corrente.";
  const inicio = s.find((p) => p.valor !== null);
  const base = `Em ${formatMes(u.mes)}, ${formatPct(u.valor, 2)} da carteira agregada estava vencida e não paga`;
  if (!inicio || inicio.valor === null || inicio.mes === u.mes) return `${base}.`;
  return `${base}, contra ${formatPct(inicio.valor, 2)} em ${formatMes(inicio.mes)}.`;
}

function fraseSubordinacao(s: Serie, quebra: string | null): string {
  const u = ultimo(s);
  if (!u || u.valor === null) return "Sem índice de subordinação calculável.";
  const base =
    `Em ${formatMes(u.mes)}, as cotas subordinadas respondiam por ${formatPct(u.valor)} do ` +
    `patrimônio — o colchão que absorve a primeira perda antes de atingir o cotista sênior.`;
  if (!quebra) return base;
  return `${base} A série tem quebra de classificação em ${formatMes(quebra)} e não deve ser lida de ponta a ponta.`;
}
