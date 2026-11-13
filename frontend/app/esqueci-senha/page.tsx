"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/password";

const COOLDOWN_MS = 60_000;

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  );
}

function ForgotPasswordContent() {
  const supabase = useMemo(() => createClient(), []);
  const linkError = useSearchParams().get("error");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(linkError ?? "");
  const [isError, setIsError] = useState(Boolean(linkError));
  const [isSending, setIsSending] = useState(false);
  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending || isCooldownActive) return;

    setIsSending(true);
    setMessage("");
    setIsError(false);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/confirm?next=/redefinir-senha`,
    });

    setIsSending(false);

    if (error) {
      setIsError(true);
      setMessage(getAuthErrorMessage(error.message));
      return;
    }

    // Resposta neutra para não revelar se o e-mail está cadastrado.
    setMessage(
      "Se houver uma conta com esse e-mail, enviaremos um link para redefinir a senha. Verifique também a caixa de spam.",
    );
    setIsCooldownActive(true);
    cooldownTimerRef.current = setTimeout(() => {
      setIsCooldownActive(false);
      cooldownTimerRef.current = null;
    }, COOLDOWN_MS);
  }

  return (
    <main className="min-h-dvh w-full flex items-center justify-center bg-white p-4 font-sans text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <span className="text-lg font-bold tracking-widest text-orange-700 dark:text-orange-400 uppercase">
            Yourkurt
          </span>
          <h1 className="text-3xl font-bold">Esqueceu a senha?</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Informe seu e-mail e enviaremos um link para criar uma nova senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </label>

          <button
            type="submit"
            disabled={isSending || isCooldownActive}
            className="rounded-lg btn-gradient px-4 py-3 font-bold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending
              ? "Enviando..."
              : isCooldownActive
                ? "Aguarde para reenviar"
                : "Enviar link"}
          </button>
        </form>

        {message && (
          <p
            role="status"
            className={`rounded-lg border px-3 py-2 text-sm ${
              isError
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
            }`}
          >
            {message}
          </p>
        )}

        <Link
          href="/login"
          className="text-center text-sm font-medium text-orange-700 underline dark:text-orange-400"
        >
          Voltar para o login
        </Link>
      </div>
    </main>
  );
}
