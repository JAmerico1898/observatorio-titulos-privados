import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";

import { Nav } from "@/components/Nav";
import { Rodape } from "@/components/Rodape";
import "./globals.css";

/**
 * Trio tipográfico (spec §2.1, nível 1).
 * Newsreader carrega a voz editorial; Plex Sans, o registro técnico;
 * Plex Mono, os números — que são o assunto do painel, não um detalhe dele.
 */
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Observatório de Títulos Privados",
    template: "%s · Observatório de Títulos Privados",
  },
  description:
    "Estoque dos títulos privados de renda fixa no Brasil e a migração do crédito às empresas do balanço dos bancos para o mercado de capitais. Dados oficiais do BCB e da CVM.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable}`}>
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-[var(--radius)] focus:bg-ink focus:px-3 focus:py-2 focus:text-ink-inverse"
        >
          Pular para o conteúdo
        </a>
        <Nav />
        <main id="conteudo" className="mx-auto w-full max-w-[1180px] px-5 pb-20">
          {children}
        </main>
        <Rodape />
      </body>
    </html>
  );
}
