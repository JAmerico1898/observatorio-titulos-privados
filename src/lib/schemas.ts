import { z } from "zod";

/** "AAAA-MM" */
export const zMes = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "mês deve ser AAAA-MM");

export const zPonto = z.object({
  mes: zMes,
  valor: z.number().finite().nullable(),
});

export const zSerie = z.array(zPonto);

/** Resposta crua da API de dados do SGS. */
export const zRespostaSGS = z.array(
  z.object({
    data: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
    valor: z.string(),
  }),
);

/** Série já normalizada para R$ milhões (ou % a.a. quando for taxa). */
export const zSerieNomeada = z.object({
  chave: z.string(),
  codigo: z.number().int(),
  titulo: z.string(),
  rotulo: z.string(),
  /** Unidade **depois** da normalização do pipeline. */
  unidade: z.enum(["milhoes-brl", "percent-aa"]),
  pontos: zSerie,
});

export const zMeta = z.object({
  processadoEm: z.string(),
  /** Mês de referência mais recente comum às séries centrais. */
  mesReferencia: zMes,
  fontes: z.array(
    z.object({
      nome: z.string(),
      ultimoPeriodo: z.string(),
      url: z.string(),
    }),
  ),
});

export const zSgsBundle = z.object({
  series: z.array(zSerieNomeada),
});

/* ---- CETIP congelado (LCI/LCA) ---- */
export const zCetip = z.object({
  dataCorte: z.string(),
  /** Mensalizado a partir do diário: último dia útil de cada mês. */
  meses: z.array(
    z.object({
      mes: zMes,
      lci: z.number().nullable(),
      lca: z.number().nullable(),
    }),
  ),
});

/* ---- FIDC (CVM) ---- */
export const zFidcMes = z.object({
  mes: zMes,
  fundos: z.number().int().nonnegative(),
  plTotal: z.number(),
  carteiraDireitosCreditorios: z.number(),
  creditosVencidos: z.number(),
  /**
   * PL por classe de cota, agregado **apenas** sobre os informes cujas cotas
   * reconciliam com o PL declarado pelo próprio fundo. Os informes da CVM
   * contêm erros de digitação pontuais — em jan/2013 uma única linha reportava
   * cota de R$ 103 bi e sozinha inflava o agregado em 40×. Ver `cobertura`.
   */
  plSenior: z.number(),
  plSubordinada: z.number(),
  /** Fração do PL total que entrou no cálculo de subordinação (0 a 1). */
  cobertura: z.number().min(0).max(1),
});

export const zFidcClasse = z.object({
  rotulo: z.string(),
  valor: z.number(),
});

export const zFidc = z.object({
  meses: z.array(zFidcMes),
  /** Composição da carteira por classe de recebível no último mês. */
  classesUltimoMes: z.array(zFidcClasse),
  mesClasses: zMes,
  /**
   * Mês em que o índice de subordinação dá um salto grande demais para ser
   * movimento de mercado — sinal de que a CVM reclassificou os rótulos de
   * cota. Detectado nos dados, não escrito à mão. `null` se não houver.
   */
  quebraSubordinacao: zMes.nullable(),
});

export type SerieNomeada = z.infer<typeof zSerieNomeada>;
export type SgsBundle = z.infer<typeof zSgsBundle>;
export type Meta = z.infer<typeof zMeta>;
export type Cetip = z.infer<typeof zCetip>;
export type Fidc = z.infer<typeof zFidc>;
export type FidcMes = z.infer<typeof zFidcMes>;
