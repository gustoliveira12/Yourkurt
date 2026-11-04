"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { validateNewPassword } from "@/lib/password";
import { resetPassword } from "./actions";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [needsLogoutRetry, setNeedsLogoutRetry] = useState(false);

  async function finishLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage("Não foi possível encerrar a sessão. Tente novamente.");
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const validationError = validateNewPassword(password, confirmPassword);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const result = await resetPassword(password, confirmPassword);

      if (result.status === "ok") {
        router.replace("/login");
        router.refresh();
        return;
      }

      setMessage(result.message);

      if (result.status === "password_updated_logout_failed") {
        setNeedsLogoutRetry(true);
      }
    } catch {
      setMessage("Não foi possível salvar a nova senha. Verifique sua conexão e tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-dvh w-full flex items-center justify-center bg-white p-4 font-sans text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <span className="text-lg font-bold tracking-widest text-orange-600 dark:text-orange-400 uppercase">
            Yourkurt
          </span>
          <h1 className="text-3xl font-bold">Criar nova senha</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Escolha uma nova senha para sua conta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Nova senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Confirmar nova senha
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </label>

          <button
            type="submit"
            disabled={isSaving || needsLogoutRetry}
            className="rounded-lg bg-orange-500 px-4 py-3 font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>

        {message && (
          <p
            role="status"
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {message}
          </p>
        )}

        {needsLogoutRetry && (
          <button
            type="button"
            onClick={() => void finishLogout()}
            className="rounded-lg border border-orange-400 px-4 py-3 font-bold text-orange-600 transition hover:bg-orange-400/10 dark:text-orange-400"
          >
            Tentar sair novamente
          </button>
        )}

        <Link
          href="/esqueci-senha"
          className="text-center text-sm font-medium text-orange-600 underline dark:text-orange-400"
        >
          Solicitar novo link
        </Link>
      </div>
    </main>
  );
}
