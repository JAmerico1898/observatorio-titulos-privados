import type { Metadata } from "next";
import { Inter, Public_Sans } from "next/font/google";

import { Nav } from "@/components/Nav";
import { Rodape } from "@/components/Rodape";
import "./globals.css";

/**
 * Par tipográfico da referência (football-clubs-financials): Public Sans nos
 * títulos e nos números, Inter no corpo e nos rótulos.
 */
const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
      <body className={`${publicSans.variable} ${inter.variable}`}>
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-[var(--radius)] focus:bg-ink focus:px-3 focus:py-2 focus:text-ink-inverse"
        >
          Pular para o conteúdo
        </a>
        <Nav />
        <main id="conteudo" className="animate-fade-in mx-auto w-full max-w-[1180px] px-5 pb-20">
          {children}
        </main>
        <Rodape />
      </body>
    </html>
  );
}
