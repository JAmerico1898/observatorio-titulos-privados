import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ChartBlock } from "@/components/ChartBlock";
import { DataTable } from "@/components/DataTable";
import { KpiCard } from "@/components/KpiCard";

describe("KpiCard", () => {
  it("mostra valor, procedência e mês de referência", () => {
    render(
      <KpiCard rotulo="Mercado de capitais" valor="R$ 2,6 tri" fonte="SGS 28851 · BCB" mes="2026-06" />,
    );
    expect(screen.getByText("R$ 2,6 tri")).toBeInTheDocument();
    expect(screen.getByText("SGS 28851 · BCB")).toBeInTheDocument();
    expect(screen.getByText("junho de 2026")).toBeInTheDocument();
  });

  it("só exibe o selo quando o número é calculado pelo painel", () => {
    // O selo é referência a um indicador registrado, não enfeite: sem ele o
    // leitor não distingue o que o BCB publica do que o painel deriva.
    const { rerender } = render(
      <KpiCard rotulo="Saldo" valor="R$ 1 bi" fonte="SGS 28848 · BCB" mes="2026-06" />,
    );
    expect(screen.queryByText("cálculo próprio")).not.toBeInTheDocument();

    rerender(
      <KpiCard
        rotulo="Participação"
        valor="52,0%"
        fonte="SGS 28851, 28848 · BCB"
        mes="2026-06"
        indicador="partMercCap"
      />,
    );
    expect(screen.getByText("cálculo próprio")).toBeInTheDocument();
  });

  it("marca a variação de uma taxa em p.p. e a de um estoque em %", () => {
    // Trocar as duas unidades é o erro de leitura mais comum: 1,6 p.p. e 1,6%
    // não são a mesma coisa quando a grandeza já é um percentual.
    const { rerender } = render(
      <KpiCard
        rotulo="Participação"
        valor="52,0%"
        fonte="SGS"
        mes="2026-06"
        variacao={0.016}
        tipoVariacao="pp"
      />,
    );
    expect(screen.getByText("+1,6 p.p.")).toBeInTheDocument();

    rerender(
      <KpiCard rotulo="Estoque" valor="R$ 2,6 tri" fonte="SGS" mes="2026-06" variacao={0.016} />,
    );
    expect(screen.getByText("+1,6%")).toBeInTheDocument();
  });

  it("não pinta a variação de um estoque como boa ou ruim", () => {
    // Estoque subindo não é bom nem ruim — é o fenômeno medido. A cor
    // semântica é reservada a custo do crédito, onde alta é deterioração.
    const { container, rerender } = render(
      <KpiCard rotulo="Estoque" valor="R$ 1 bi" fonte="SGS" mes="2026-06" variacao={0.02} />,
    );
    expect(container.querySelector(".text-var-flat")).toBeTruthy();
    expect(container.querySelector(".text-var-down")).toBeNull();

    rerender(
      <KpiCard
        rotulo="ICC"
        valor="17,6% a.a."
        fonte="SGS"
        mes="2026-06"
        variacao={0.02}
        tipoVariacao="pp"
        semantica="menor-melhor"
      />,
    );
    expect(container.querySelector(".text-var-down")).toBeTruthy();
  });

  it("omite a linha de variação quando não há base para calcular", () => {
    render(<KpiCard rotulo="Novo" valor="R$ 1 bi" fonte="SGS" mes="2026-06" variacao={null} />);
    expect(screen.queryByText(/p\.p\.|%$/)).not.toBeInTheDocument();
  });
});

describe("DataTable", () => {
  const colunas = [
    { chave: "a", rotulo: "Canal A", formato: "brl" as const },
    { chave: "b", rotulo: "Canal B", formato: "pct" as const },
  ];
  const linhas = [
    { mes: "2026-05", a: 1_500, b: 0.5 },
    { mes: "2026-06", a: 2_000, b: null },
  ];

  it("aplica o formato declarado por coluna", () => {
    render(<DataTable colunas={colunas} linhas={linhas} legenda="Teste" />);
    expect(screen.getByText("R$ 1,5 bi")).toBeInTheDocument();
    expect(screen.getByText("50,0%")).toBeInTheDocument();
  });

  it("mostra o mês mais recente primeiro", () => {
    // É o que o leitor procura ao abrir a tabela.
    render(<DataTable colunas={colunas} linhas={linhas} legenda="Teste" />);
    const linhasTabela = screen.getAllByRole("row");
    expect(within(linhasTabela[1]).getByText("junho de 2026")).toBeInTheDocument();
  });

  it("mostra lacuna como travessão, nunca como zero", () => {
    render(<DataTable colunas={colunas} linhas={linhas} legenda="Teste" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

describe("ChartBlock", () => {
  const props = {
    fonte: "SGS 28851 · BCB",
    colunas: [{ chave: "v", rotulo: "Valor", formato: "brl" as const }],
    linhas: [{ mes: "2026-06", v: 1_000 }],
  };

  it("sempre publica a frase de leitura junto do gráfico", () => {
    // A frase é obrigatória em 100% dos gráficos (eval da §7.2) porque o
    // gráfico sozinho não diz ao aluno o que ele deveria estar vendo.
    render(
      <ChartBlock titulo="Estoque" frase="Em junho de 2026, o estoque somava R$ 1,0 bi." {...props}>
        <div>gráfico</div>
      </ChartBlock>,
    );
    expect(screen.getByText(/Em junho de 2026, o estoque somava/)).toBeInTheDocument();
  });

  it("alterna gráfico e tabela pelo mesmo controle", async () => {
    // A tabela não é extra: é o "relief" exigido pela paleta, cujas cores mais
    // claras ficam abaixo de 3:1 de contraste contra a superfície.
    const user = userEvent.setup();
    render(
      <ChartBlock titulo="Estoque" frase="Frase." {...props}>
        <div>gráfico</div>
      </ChartBlock>,
    );
    const botao = screen.getByRole("button", { name: /ver em tabela/i });
    expect(botao).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    await user.click(botao);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ocultar tabela/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("marca bloco congelado com a data de corte no título", () => {
    // Uma série encerrada não pode se confundir com uma viva — o leitor
    // compararia o último ponto dela com o mês corrente das outras.
    const { container } = render(
      <ChartBlock titulo="LCI × LCA" frase="Frase." congeladoEm="2025-12-11" {...props}>
        <div>gráfico</div>
      </ChartBlock>,
    );
    expect(screen.getByText("série encerrada")).toBeInTheDocument();
    expect(screen.getByText(/encerrada em 11\/12\/2025/)).toBeInTheDocument();
    expect(container.querySelector("[data-congelado='true']")).toBeTruthy();
  });

  it("bloco vivo não recebe marcação de congelado", () => {
    const { container } = render(
      <ChartBlock titulo="Estoque" frase="Frase." {...props}>
        <div>gráfico</div>
      </ChartBlock>,
    );
    expect(screen.queryByText("série encerrada")).not.toBeInTheDocument();
    expect(container.querySelector("[data-congelado='true']")).toBeNull();
  });

  it("exibe o selo quando o gráfico mostra número derivado", () => {
    render(
      <ChartBlock titulo="Participação" frase="Frase." indicador="partMercCap" {...props}>
        <div>gráfico</div>
      </ChartBlock>,
    );
    expect(screen.getByText("cálculo próprio")).toBeInTheDocument();
  });
});
