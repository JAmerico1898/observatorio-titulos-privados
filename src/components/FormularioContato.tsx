"use client";

import { useState } from "react";

/**
 * Formulário de contato — envia a mensagem para /api/contact, que a encaminha
 * por Pushover. Só a mensagem é obrigatória.
 */
export function FormularioContato() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [estado, setEstado] = useState<"parado" | "enviando" | "enviado" | "erro">("parado");

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("enviando");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nome.trim(), email: email.trim(), message: mensagem }),
      });

      if (res.ok) {
        setEstado("enviado");
        setNome("");
        setEmail("");
        setMensagem("");
      } else {
        setEstado("erro");
      }
    } catch {
      setEstado("erro");
    }
  };

  if (estado === "enviado") {
    return (
      <div className="card-surface max-w-xl p-6">
        <div className="data-ribbon mb-4" />
        <p className="font-display text-lg font-bold text-ink">Mensagem enviada.</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          Obrigado. A mensagem chegou; a resposta vai para o e-mail informado, se houver.
        </p>
      </div>
    );
  }

  const campo =
    "w-full rounded-[var(--radius)] border border-rule bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-3 outline-none transition-colors focus:border-brand-blue";

  return (
    <form onSubmit={enviar} className="card-surface flex max-w-xl flex-col gap-5 p-6">
      <div className="data-ribbon" />

      <div>
        <label htmlFor="contato-nome" className="eyebrow mb-1.5 block">
          Nome
        </label>
        <input
          id="contato-nome"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Como devo chamar você"
          className={campo}
        />
      </div>

      <div>
        <label htmlFor="contato-email" className="eyebrow mb-1.5 block">
          E-mail
        </label>
        <input
          id="contato-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Para eu poder responder"
          className={campo}
        />
      </div>

      <div>
        <label htmlFor="contato-mensagem" className="eyebrow mb-1.5 block">
          Mensagem (obrigatória)
        </label>
        <textarea
          id="contato-mensagem"
          required
          rows={6}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Dúvida, erro encontrado, sugestão de série ou de recorte"
          className={`${campo} resize-y`}
        />
      </div>

      {estado === "erro" && (
        <div
          role="alert"
          className="rounded-[var(--radius)] border border-brand-red bg-surface-sunken px-4 py-3 text-sm text-brand-red"
        >
          Não foi possível enviar. Tente de novo em alguns instantes.
        </div>
      )}

      <button
        type="submit"
        disabled={estado === "enviando"}
        className="self-start rounded-full bg-brand-blue px-6 py-3 text-sm font-bold text-ink-inverse transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {estado === "enviando" ? "Enviando…" : "Enviar mensagem"}
      </button>
    </form>
  );
}
