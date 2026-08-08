import type { Metadata } from "next";

import { Cabecalho, Secao } from "@/components/Cabecalho";
import { FormularioContato } from "@/components/FormularioContato";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Dúvidas sobre a metodologia, erros encontrados nos números ou sugestões de novas séries e recortes.",
};

export default function Page() {
  return (
    <>
      <Cabecalho
        titulo="Entre em contato"
        resumo="Dúvida sobre a metodologia, erro encontrado em algum número, sugestão de série ou de recorte — escreva. Só a mensagem é obrigatória; o e-mail serve para eu poder responder."
      />

      <Secao titulo="Mensagem">
        <FormularioContato />
      </Secao>
    </>
  );
}
