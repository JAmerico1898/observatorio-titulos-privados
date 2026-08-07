export function Cabecalho({
  eyebrow,
  titulo,
  resumo,
}: {
  eyebrow: string;
  titulo: string;
  resumo: string;
}) {
  return (
    <header className="border-b border-rule py-10">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 max-w-3xl font-display text-4xl leading-[1.1] font-semibold tracking-tight text-ink sm:text-5xl">
        {titulo}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-2">{resumo}</p>
    </header>
  );
}

export function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-8">
      <h2 className="mb-4 font-display text-2xl leading-tight font-medium text-ink">{titulo}</h2>
      {children}
    </section>
  );
}

/** Bloco de prosa técnica — tom MBA, largura de leitura controlada. */
export function NotaTecnica({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius)] border-l-2 border-rule-strong bg-surface p-5">
      <h3 className="font-display text-lg font-medium text-ink">{titulo}</h3>
      <div className="mt-2 max-w-prose space-y-3 text-sm leading-relaxed text-ink-2">{children}</div>
    </div>
  );
}
