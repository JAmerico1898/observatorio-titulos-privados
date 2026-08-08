import type { Metadata } from "next";

import { Cabecalho } from "@/components/Cabecalho";
import { GLOSSARIO } from "@/data/glossario";

export const metadata: Metadata = {
  title: "Glossário",
  description: "O vocabulário técnico do painel de títulos privados, definido termo a termo.",
};

export default function Page() {
  const verbetes = [...GLOSSARIO].sort((a, b) => a.termo.localeCompare(b.termo, "pt-BR"));

  return (
    <>
      <Cabecalho titulo="Glossário" />

      <nav aria-label="Índice do glossário" className="border-b border-rule py-6">
        <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
          {verbetes.map((v) => (
            <li key={v.id}>
              <a
                href={`#${v.id}`}
                className="text-sm text-ink-2 underline underline-offset-4 hover:text-ink"
              >
                {v.termo.split(" — ")[0]}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <dl className="divide-y divide-rule">
        {verbetes.map((v) => (
          <div key={v.id} id={v.id} className="scroll-mt-24 py-6">
            <dt className="font-display text-xl leading-tight font-bold text-ink">{v.termo}</dt>
            <dd className="mt-2 max-w-prose text-sm leading-relaxed text-ink-2">{v.definicao}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
