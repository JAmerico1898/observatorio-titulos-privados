"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { aplicarFormato, formatMes, formatMesCurto, type Formato } from "@/lib/format";

/**
 * Primitivas de gráfico.
 *
 * As cores vêm sempre de `var(--series-N)` — a paleta é definida uma única vez
 * em globals.css e foi validada pelo validador do skill dataviz (banda de
 * luminosidade, piso de croma, separação CVD e piso de visão normal).
 * Nenhum hex aqui.
 */

export type SerieGrafico = {
  chave: string;
  rotulo: string;
  /** Slot 1..8 da paleta categórica, atribuído por entidade — nunca por ranking. */
  slot: number;
  tracejada?: boolean;
};

export type LinhaDados = { mes: string } & Record<string, number | null | string>;

const cor = (slot: number) => `var(--series-${slot})`;
const EIXO = { fill: "var(--ink-3)", fontSize: 11 };
const ALTURA = 300;

function TooltipPainel({
  active,
  payload,
  label,
  formato,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | null; color?: string; dataKey?: string }>;
  label?: string;
  formato: Formato;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[var(--radius)] border border-rule-strong bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium text-ink">{formatMes(label)}</p>
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={p.dataKey} className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block size-2 shrink-0 rounded-[1px]"
              style={{ background: p.color }}
            />
            <span className="text-ink-2">{p.name}</span>
            <span className="tnum ml-auto pl-3 text-ink">
              {aplicarFormato(formato, typeof p.value === "number" ? p.value : null)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const legendaProps = {
  wrapperStyle: { fontSize: 12, paddingTop: 8, color: "var(--ink-2)" },
  iconType: "square" as const,
  iconSize: 9,
};

/** Intervalo de ticks que mantém ~8 rótulos legíveis em qualquer janela. */
const intervaloTicks = (n: number) => Math.max(0, Math.floor(n / 8));

export function GraficoLinhas({
  dados,
  series,
  formato,
  marcarMes,
  rotuloMarca,
}: {
  dados: LinhaDados[];
  series: SerieGrafico[];
  formato: Formato;
  /** Mês destacado por régua vertical — usado no cruzamento da tese. */
  marcarMes?: string | null;
  rotuloMarca?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={ALTURA}>
      <LineChart data={dados} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
        <CartesianGrid stroke="var(--rule)" vertical={false} />
        <XAxis
          dataKey="mes"
          tickFormatter={formatMesCurto}
          tick={EIXO}
          tickLine={false}
          axisLine={{ stroke: "var(--rule-strong)" }}
          interval={intervaloTicks(dados.length)}
        />
        <YAxis
          tickFormatter={(v) => aplicarFormato(formato, v)}
          tick={EIXO}
          tickLine={false}
          axisLine={false}
          width={72}
          tickCount={5}
        />
        <Tooltip content={<TooltipPainel formato={formato} />} cursor={{ stroke: "var(--rule-strong)" }} />
        {series.length > 1 && <Legend {...legendaProps} />}
        {marcarMes && (
          <ReferenceLine
            x={marcarMes}
            stroke="var(--ink-3)"
            strokeDasharray="3 3"
            // Ancorado à direita da régua: essas marcas caem perto do fim da
            // janela (é onde o cruzamento e a quebra acontecem) e o rótulo
            // alinhado à esquerda sairia da área do gráfico.
            label={{
              value: rotuloMarca,
              position: "insideTopRight",
              fill: "var(--ink-2)",
              fontSize: 11,
            }}
          />
        )}
        {series.map((s) => (
          <Line
            key={s.chave}
            type="monotone"
            dataKey={s.chave}
            name={s.rotulo}
            stroke={cor(s.slot)}
            strokeWidth={2}
            strokeDasharray={s.tracejada ? "5 4" : undefined}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function GraficoAreaEmpilhada({
  dados,
  series,
  formato,
  percentual = false,
}: {
  dados: LinhaDados[];
  series: SerieGrafico[];
  formato: Formato;
  percentual?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={ALTURA}>
      <AreaChart data={dados} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
        <CartesianGrid stroke="var(--rule)" vertical={false} />
        <XAxis
          dataKey="mes"
          tickFormatter={formatMesCurto}
          tick={EIXO}
          tickLine={false}
          axisLine={{ stroke: "var(--rule-strong)" }}
          interval={intervaloTicks(dados.length)}
        />
        <YAxis
          tickFormatter={(v) => aplicarFormato(formato, v)}
          tick={EIXO}
          tickLine={false}
          axisLine={false}
          width={72}
          tickCount={5}
          domain={percentual ? [0, 1] : undefined}
        />
        <Tooltip content={<TooltipPainel formato={formato} />} cursor={{ stroke: "var(--rule-strong)" }} />
        {series.length > 1 && <Legend {...legendaProps} />}
        {series.map((s) => (
          <Area
            key={s.chave}
            type="monotone"
            dataKey={s.chave}
            name={s.rotulo}
            stackId="1"
            stroke="var(--surface)"
            // Vão de 2px na cor da superfície separa as faixas empilhadas.
            strokeWidth={2}
            fill={cor(s.slot)}
            fillOpacity={0.9}
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function GraficoBarras({
  dados,
  series,
  formato,
}: {
  dados: LinhaDados[];
  series: SerieGrafico[];
  formato: Formato;
}) {
  return (
    <ResponsiveContainer width="100%" height={ALTURA}>
      <BarChart data={dados} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
        <CartesianGrid stroke="var(--rule)" vertical={false} />
        <XAxis
          dataKey="mes"
          tickFormatter={formatMesCurto}
          tick={EIXO}
          tickLine={false}
          axisLine={{ stroke: "var(--rule-strong)" }}
          interval={intervaloTicks(dados.length)}
        />
        <YAxis
          tickFormatter={(v) => aplicarFormato(formato, v)}
          tick={EIXO}
          tickLine={false}
          axisLine={false}
          width={72}
          tickCount={5}
        />
        <ReferenceLine y={0} stroke="var(--rule-strong)" />
        <Tooltip content={<TooltipPainel formato={formato} />} cursor={{ fill: "var(--surface-sunken)" }} />
        {series.length > 1 && <Legend {...legendaProps} />}
        {series.map((s) => (
          <Bar
            key={s.chave}
            dataKey={s.chave}
            name={s.rotulo}
            fill={cor(s.slot)}
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Barras horizontais para composição num único mês (ranking de categorias). */
export function GraficoBarrasHorizontais({
  dados,
  formato,
  altura = 340,
}: {
  dados: Array<{ rotulo: string; valor: number; slot: number }>;
  formato: Formato;
  altura?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={dados} layout="vertical" margin={{ top: 8, right: 56, bottom: 0, left: 8 }}>
        <CartesianGrid stroke="var(--rule)" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => aplicarFormato(formato, v)} tick={EIXO} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="rotulo"
          tick={EIXO}
          tickLine={false}
          axisLine={{ stroke: "var(--rule-strong)" }}
          width={160}
        />
        <Tooltip
          content={<TooltipPainel formato={formato} />}
          cursor={{ fill: "var(--surface-sunken)" }}
        />
        <Bar dataKey="valor" name="Valor" radius={[0, 2, 2, 0]} isAnimationActive={false}>
          {dados.map((d) => (
            <Cell key={d.rotulo} fill={cor(d.slot)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
