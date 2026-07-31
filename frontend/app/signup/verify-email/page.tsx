"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function getBaseOrigin() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function getRateLimitMessage(rawMessage: string) {
  const lowered = rawMessage.toLowerCase();
  if (lowered.includes("rate limit") || lowered.includes("too many requests")) {
    return "Voce atingiu o limite de envios por agora. Aguarde alguns minutos e tente novamente.";
  }

  return rawMessage;
}

export default function VerifyEmailPage() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";
  const error = searchParams.get("error");
  const [statusMessage, setStatusMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canResend = Boolean(email) && !isResending && !isCooldownActive;

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  function startCooldown() {
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }

    setIsCooldownActive(true);
    cooldownTimerRef.current = setTimeout(() => {
      setIsCooldownActive(false);
      cooldownTimerRef.current = null;
    }, 60_000);
  }

  async function handleResendEmail() {
    if (!email || !canResend) return;

    setIsResending(true);
    setStatusMessage("");

    const origin = getBaseOrigin();
    const emailRedirectTo = origin ? `${origin}/auth/confirm?next=/` : undefined;

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo,
        },
      });

      if (error) {
        throw new Error(getRateLimitMessage(error.message));
      }

      setStatusMessage("Novo e-mail enviado. Verifique sua caixa de entrada e spam.");
      startCooldown();
    } catch (err) {
      setStatusMessage(
        err instanceof Error
          ? getRateLimitMessage(err.message)
          : "Nao foi possivel reenviar o e-mail agora.",
      );

      startCooldown();
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main className="min-h-dvh w-full bg-background p-4 md:p-6">
      <div className="mx-auto flex min-h-[80dvh] w-full max-w-2xl items-center justify-center">
        <section className="w-full rounded-3xl border border-border-base bg-background-raised p-6 md:p-10">
          <span className="inline-flex rounded-full bg-background px-3 py-1 text-xs font-bold uppercase tracking-widest text-foreground-brand">
            Verificação
          </span>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground md:text-4xl">
            Verifique seu e-mail
          </h1>

          <p className="mt-3 text-subtitle">
            Enviamos um link de confirmação para {email ? <strong>{email}</strong> : "seu e-mail"}. Abra sua caixa de entrada e clique no link para ativar sua conta.
          </p>

          <p className="mt-3 text-subtitle">
            Assim que você confirmar, o acesso será feito automaticamente.
          </p>

          {(error || statusMessage) && (
            <p className="mt-4 rounded-lg border border-border-base bg-background px-3 py-2 text-sm text-foreground">
              {statusMessage || error}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={!canResend}
              className="inline-flex items-center justify-center rounded-xl border border-border-base px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResending ? "Reenviando..." : "Reenviar e-mail"}
            </button>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-border-base px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-background"
            >
              Ir para login
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold text-foreground-inverted gradient-to-l"
            >
              Voltar ao cadastro
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
