export function Cabecalho({
  eyebrow,
  titulo,
  resumo,
}: {
  eyebrow?: string;
  titulo: string;
  resumo?: string;
}) {
  return (
    <header className="border-b border-rule py-10">
      <div className="data-ribbon mb-4" />
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className="mt-2 max-w-3xl font-display text-4xl leading-tight font-extrabold tracking-tight text-ink sm:text-5xl">
        {titulo}
      </h1>
      {resumo ? (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-2">{resumo}</p>
      ) : null}
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
      <h2 className="mb-4 font-display text-2xl leading-tight font-bold tracking-tight text-ink">
        {titulo}
      </h2>
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
    <div className="card-surface p-6">
      <div className="data-ribbon mb-4" />
      <h3 className="font-display text-lg font-bold text-ink">{titulo}</h3>
      <div className="mt-2 max-w-prose space-y-3 text-sm leading-relaxed text-ink-2">{children}</div>
    </div>
  );
}
