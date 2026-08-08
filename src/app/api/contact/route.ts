import { NextResponse } from "next/server";

/**
 * Recebe o formulário de contato e encaminha a mensagem por Pushover.
 *
 * Exige duas variáveis de ambiente na Vercel:
 *   PUSHOVER_TOKEN — token da aplicação (Pushover → Your Applications)
 *   PUSHOVER_USER  — user key da conta (topo do dashboard do Pushover)
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { name, email, message } = (body ?? {}) as {
    name?: string;
    email?: string;
    message?: string;
  };

  if (!message || message.trim().length === 0) {
    return NextResponse.json({ error: "A mensagem é obrigatória." }, { status: 400 });
  }

  const token = process.env.PUSHOVER_TOKEN;
  const user = process.env.PUSHOVER_USER;

  if (!token || !user) {
    console.error("[contato] PUSHOVER_TOKEN ou PUSHOVER_USER ausente no ambiente");
    return NextResponse.json({ error: "Envio não configurado." }, { status: 500 });
  }

  const corpo = [
    name ? `Nome: ${name}` : null,
    email ? `Email: ${email}` : null,
    "",
    message.trim(),
  ]
    .filter(Boolean)
    .join("\n");

  // Form-urlencoded: é o formato documentado pelo Pushover e o que está
  // comprovadamente funcionando nos outros painéis.
  const params = new URLSearchParams();
  params.append("token", token);
  params.append("user", user);
  params.append("title", "Observatório de Títulos Privados — contato");
  params.append("message", corpo);

  try {
    const res = await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!res.ok) {
      const detalhe = await res.text();
      console.error("[contato] Pushover recusou o envio", res.status, detalhe);
      return NextResponse.json({ error: "Falha ao enviar." }, { status: 502 });
    }
  } catch (erro) {
    console.error("[contato] erro de rede ao chamar o Pushover", erro);
    return NextResponse.json({ error: "Falha ao enviar." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
