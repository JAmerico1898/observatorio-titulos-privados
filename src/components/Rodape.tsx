import { meta } from "@/lib/dados";

export function Rodape() {
  const ano = new Date(meta.processadoEm).getFullYear();
  return (
    <footer
      className="mt-auto w-full text-ink-inverse"
      style={{ backgroundColor: "var(--hero-ate)" }}
    >
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-5 py-8 text-[0.6875rem] font-semibold tracking-[0.12em] uppercase sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p>© {ano} Laboratório de Mercado Financeiro</p>
          <p>Prof. José Américo — COPPEAD-FGV-UCAM</p>
        </div>
        <div className="space-y-1 sm:text-right">
          <p>Dúvidas, erros, sugestões?</p>
          <p>Entre em contato!</p>
        </div>
      </div>
    </footer>
  );
}
