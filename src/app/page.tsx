import Link from "next/link";

import { NotaTecnica, Secao } from "@/components/Cabecalho";
import { ChartBlock } from "@/components/ChartBlock";
import { KpiCard } from "@/components/KpiCard";
import { GraficoAreaEmpilhada } from "@/components/charts";
import { PAGINAS } from "@/data/paginas";
import { combinar, fidc, fonteDe, fonteDeVarias, meta, serie } from "@/lib/dados";
import { formatBRL, formatMes, formatPct, formatTaxa } from "@/lib/format";
import { fraseComposicao } from "@/lib/frases";
import {
  cruzamento,
  partMercCap,
  somar,
  subtrair,
  ultimo,
  valorEm,
  mesMenos,
  type Serie,
} from "@/lib/transforms";

const DESTAQUES: Record<string, string> = {
  "/captacao-bancaria": "Depósitos a prazo, letras de crédito e letras financeiras — o funding do banco.",
  "/mercado-de-capitais": "Debêntures, securitização e o espaço ocupado pela dívida pública.",
  "/fidcs": "PL, inadimplência e subordinação do crédito estruturado.",
  "/credito-e-desintermediacao": "A página-tese: a migração do crédito, medida mês a mês.",
  "/custo-do-credito": "ICC e spread — o mecanismo de preço por trás da migração.",
  "/glossario": "O vocabulário técnico do painel, com âncoras.",
  "/sobre": "Fontes, fórmulas, perímetros e o que ficou de fora.",
};

export default function Page() {
  const mes = meta.mesReferencia;

  const captacao = serie("captacaoBancariaTotal");
  const mercCap = serie("mercCapEmpresas");
  const debentures = serie("mercCapPrivados");
  const securitizados = subtrair(mercCap, debentures);
  const credBanc = serie("credBancarioEmpresas");
  const totalMonitorado = somar(captacao, mercCap);
  const part = partMercCap(mercCap, credBanc);
  const cruzou = cruzamento(mercCap, credBanc);

  const uFidc = fidc.meses.at(-1)!;

  const dadosComposicao = combinar({
    depositosPrazo: serie("depositosPrazo"),
    letrasCredito: serie("letrasCredito"),
    letrasFinanceiras: serie("letrasFinanceiras"),
    outrosTitulosPrivados: serie("outrosTitulosPrivados"),
    debentures,
    securitizados,
  });

  return (
    <>
      <section className="border-b border-rule py-10">
        <p className="eyebrow">Laboratório de Mercado Financeiro · COPPEAD–FGV–UCAM</p>
        <h1 className="mt-2 max-w-4xl font-display text-5xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-6xl">
          O estoque de títulos privados, medido
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-2">
          Quanto existe emitido em renda fixa privada no Brasil, como esse estoque se reparte entre
          o funding bancário e o mercado de capitais, e a que custo as empresas se financiam no
          banco. Séries oficiais do Banco Central e da CVM, sem fonte autenticada, processadas em{" "}
          {formatMes(mes)}.
        </p>

        {/* A tese, dita antes de qualquer gráfico. */}
        <div className="grid-ground mt-8 rounded-[var(--radius)] border border-rule bg-surface p-6">
          <p className="eyebrow">O achado que abre o painel</p>
          <p className="mt-2 max-w-3xl font-display text-2xl leading-snug text-ink">
            {cruzou ? (
              <>
                Em {formatMes(cruzou)}, o estoque de títulos de dívida emitidos por empresas
                ultrapassou o saldo de empréstimos do sistema financeiro a empresas. Em{" "}
                {formatMes(mes)}, o mercado de capitais responde por{" "}
                <strong className="tnum">{formatPct(valorEm(part, mes))}</strong> do financiamento
                às empresas.
              </>
            ) : (
              <>
                Em {formatMes(mes)}, o mercado de capitais responde por{" "}
                <strong className="tnum">{formatPct(valorEm(part, mes))}</strong> do financiamento
                às empresas.
              </>
            )}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-2">
            A virada já ocorreu — o painel não anuncia uma tendência, mede um fato consumado. O
            número é sensível ao perímetro: sob o crédito ampliado a empresas, a mesma realidade
            aparece como{" "}
            {formatPct(
              (valorEm(mercCap, mes) ?? 0) / (valorEm(serie("creditoAmpliadoEmpresas"), mes) || 1),
            )}
            .{" "}
            <Link className="underline underline-offset-4" href="/credito-e-desintermediacao">
              Ver a página-tese
            </Link>
            .
          </p>
        </div>
      </section>

      <Secao titulo="O estoque hoje">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            rotulo="Estoque total monitorado"
            valor={formatBRL(valorEm(totalMonitorado, mes))}
            fonte={fonteDeVarias("captacaoBancariaTotal", "mercCapEmpresas")}
            mes={mes}
            variacao={variacaoMensal(totalMonitorado)}
            indicador="estoqueMonitorado"
            nota="Captação bancária + títulos de dívida de empresas."
          />
          <KpiCard
            rotulo="Captação bancária total"
            valor={formatBRL(valorEm(captacao, mes))}
            fonte={fonteDe("captacaoBancariaTotal")}
            mes={mes}
            variacao={variacaoMensal(captacao)}
          />
          <KpiCard
            rotulo="Títulos de dívida de empresas"
            valor={formatBRL(valorEm(mercCap, mes))}
            fonte={fonteDe("mercCapEmpresas")}
            mes={mes}
            variacao={variacaoMensal(mercCap)}
          />
          <KpiCard
            rotulo="PL agregado dos FIDCs"
            valor={formatBRL(uFidc.plTotal)}
            fonte="CVM · informe mensal"
            mes={uFidc.mes}
            variacao={variacaoFidc()}
          />
        </div>
      </Secao>

      <Secao titulo="O crédito às empresas">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            rotulo="Empréstimos do SFN a empresas"
            valor={formatBRL(valorEm(credBanc, mes))}
            fonte={fonteDe("credBancarioEmpresas")}
            mes={mes}
            variacao={variacaoMensal(credBanc)}
          />
          <KpiCard
            rotulo="Participação do mercado de capitais no crédito às empresas"
            valor={formatPct(valorEm(part, mes))}
            fonte={fonteDeVarias("mercCapEmpresas", "credBancarioEmpresas")}
            mes={mes}
            variacao={variacaoMensal(part)}
            tipoVariacao="pp"
            indicador="partMercCap"
          />
          <KpiCard
            rotulo="ICC pessoas jurídicas"
            valor={formatTaxa(valorEm(serie("iccPJ"), mes))}
            fonte={fonteDe("iccPJ")}
            mes={mes}
            variacao={variacaoPP(serie("iccPJ"))}
            tipoVariacao="pp"
            semantica="menor-melhor"
          />
          <KpiCard
            rotulo="Spread do ICC"
            valor={formatTaxa(valorEm(serie("spreadICC"), mes))}
            fonte={fonteDe("spreadICC")}
            mes={mes}
            variacao={variacaoPP(serie("spreadICC"))}
            tipoVariacao="pp"
            semantica="menor-melhor"
          />
        </div>
      </Secao>

      <Secao titulo="A composição do estoque">
        <ChartBlock
          titulo="Estoque monitorado por instrumento"
          fonte={fonteDeVarias(
            "depositosPrazo",
            "letrasCredito",
            "letrasFinanceiras",
            "outrosTitulosPrivados",
            "mercCapPrivados",
            "mercCapEmpresas",
          )}
          frase={fraseComposicao(
            "o estoque monitorado",
            [
              { rotulo: "depósitos a prazo", valor: valorEm(serie("depositosPrazo"), mes) },
              { rotulo: "letras de crédito", valor: valorEm(serie("letrasCredito"), mes) },
              { rotulo: "letras financeiras", valor: valorEm(serie("letrasFinanceiras"), mes) },
              { rotulo: "outros títulos privados", valor: valorEm(serie("outrosTitulosPrivados"), mes) },
              { rotulo: "debêntures e notas comerciais", valor: valorEm(debentures, mes) },
              { rotulo: "securitizados", valor: valorEm(securitizados, mes) },
            ],
            mes,
          )}
          indicador="composicaoEstoque"
          colunas={[
            { chave: "depositosPrazo", rotulo: "Depósitos a prazo", formato: "brl" },
            { chave: "letrasCredito", rotulo: "Letras de crédito", formato: "brl" },
            { chave: "letrasFinanceiras", rotulo: "Letras financeiras", formato: "brl" },
            { chave: "outrosTitulosPrivados", rotulo: "Outros títulos privados", formato: "brl" },
            { chave: "debentures", rotulo: "Debêntures e NC", formato: "brl" },
            { chave: "securitizados", rotulo: "Securitizados", formato: "brl" },
          ]}
          linhas={dadosComposicao}
        >
          <GraficoAreaEmpilhada
            dados={dadosComposicao}
            series={[
              { chave: "depositosPrazo", rotulo: "Depósitos a prazo (CDB/RDB)", slot: 1 },
              { chave: "letrasCredito", rotulo: "Letras de crédito", slot: 3 },
              { chave: "letrasFinanceiras", rotulo: "Letras financeiras", slot: 5 },
              { chave: "outrosTitulosPrivados", rotulo: "Outros títulos privados", slot: 6 },
              { chave: "debentures", rotulo: "Debêntures e notas comerciais", slot: 2 },
              { chave: "securitizados", rotulo: "Securitizados", slot: 4 },
            ]}
            formato="brlEixo"
          />
        </ChartBlock>
      </Secao>

      <Secao titulo="Por onde começar">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PAGINAS.slice(1).map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="block h-full rounded-[var(--radius)] border border-rule bg-surface p-4 transition-colors hover:border-rule-strong"
              >
                <span className="font-display text-lg font-medium text-ink">{p.rotulo}</span>
                <span className="mt-1 block text-sm leading-snug text-ink-2">
                  {DESTAQUES[p.href]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao titulo="Como ler este painel">
        <div className="grid gap-4 lg:grid-cols-2">
          <NotaTecnica titulo="Cinco convenções que valem em todas as páginas">
            <p>
              <strong>Estoque não é emissão.</strong> Todo valor é saldo em final de período. Um
              estoque parado pode esconder um ano inteiro de emissões compensadas por vencimentos.
            </p>
            <p>
              <strong>Valores correntes.</strong> Nada é deflacionado. Comparações de treze anos
              carregam inflação embutida.
            </p>
            <p>
              <strong>Todo gráfico tem frase de leitura e tabela.</strong> A frase é gerada a
              partir dos dados no build, não escrita à mão — se o número virar, a frase vira junto.
              O link &ldquo;ver em tabela&rdquo; abre os mesmos dados em texto.
            </p>
            <p>
              <strong>O selo cálculo próprio</strong> marca todo indicador que o painel calcula em
              vez de apenas exibir. A fórmula de cada um está em{" "}
              <Link className="underline underline-offset-4" href="/sobre">Sobre</Link>.
            </p>
            <p>
              <strong>A janela começa em janeiro de 2013.</strong> É onde começam o crédito
              ampliado do BCB e os informes de FIDC da CVM. Séries que existem antes disso são
              truncadas, salvo nos blocos históricos explicitamente rotulados.
            </p>
          </NotaTecnica>

          <NotaTecnica titulo="O que este painel não faz">
            <p>
              Não usa nenhuma fonte autenticada. Isso custa três coisas, todas declaradas: não há
              curvas de crédito nem spreads de debêntures (exigiriam ANBIMA); CRI e CRA aparecem
              agregados em &ldquo;securitizados&rdquo;, porque nenhuma fonte pública os separa; e a
              decomposição LCI × LCA vem de um acervo da CETIP encerrado em dezembro de 2025,
              exibido em bloco congelado e claramente rotulado.
            </p>
            <p>
              Também não roda nada no seu navegador: as páginas são estáticas, geradas no build a
              partir de JSONs versionados. Nenhuma chamada a API externa acontece enquanto você lê.
            </p>
          </NotaTecnica>
        </div>
      </Secao>
    </>
  );
}

function variacaoMensal(s: Serie): number | null {
  const u = ultimo(s);
  if (!u || u.valor === null) return null;
  const anterior = valorEm(s, mesMenos(u.mes, 1));
  if (!anterior) return null;
  return (u.valor - anterior) / anterior;
}

function variacaoPP(s: Serie): number | null {
  const u = ultimo(s);
  if (!u || u.valor === null) return null;
  const anterior = valorEm(s, mesMenos(u.mes, 1));
  if (anterior === null) return null;
  return (u.valor - anterior) / 100;
}

function variacaoFidc(): number | null {
  const ms = fidc.meses;
  if (ms.length < 2) return null;
  const a = ms.at(-1)!.plTotal;
  const b = ms.at(-2)!.plTotal;
  return b ? (a - b) / b : null;
}
