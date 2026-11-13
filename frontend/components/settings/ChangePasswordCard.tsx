"use client";

import { LockKeyIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage, validateNewPassword } from "@/lib/password";

const inputClass =
  "w-full rounded-lg border border-border-base bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30";

export default function ChangePasswordCard() {
  const supabase = useMemo(() => createClient(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setIsSuccess(false);

    if (!currentPassword) {
      setMessage("Informe sua senha atual.");
      return;
    }

    const validationError = validateNewPassword(newPassword, confirmPassword);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    if (newPassword === currentPassword) {
      setMessage("A nova senha deve ser diferente da senha atual.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const email = userData.user?.email;
      if (userError || !email) {
        throw new Error("Sua sessão expirou. Entre novamente.");
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verifyError) {
        throw new Error(
          verifyError.code === "invalid_credentials"
            ? "Senha atual incorreta."
            : getAuthErrorMessage(verifyError.message),
        );
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        throw new Error(getAuthErrorMessage(updateError.message));
      }

      reset();
      setIsSuccess(true);
      setMessage("Senha atualizada com sucesso.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Erro ao atualizar a senha.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-card border border-border-base bg-surface p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg bg-background p-2 text-foreground-brand">
            <LockKeyIcon size={18} weight="fill" />
          </span>
          <div className="flex flex-col">
            <h3 className="text-base font-semibold text-foreground">
              Senha e autenticação
            </h3>
            <p className="text-sm text-subtitle">
              Atualize sua senha e fortaleça sua segurança de acesso.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsOpen((open) => !open);
            setMessage("");
          }}
          className="rounded-lg border border-border-base px-3 py-2 text-sm font-semibold text-foreground hover:bg-background"
        >
          {isOpen ? "Fechar" : "Atualizar"}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            Senha atual
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className={inputClass}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            Nova senha
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className={inputClass}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            Confirmar nova senha
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className={inputClass}
              required
            />
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="self-start rounded-lg btn-gradient px-4 py-2 text-sm font-semibold transition hover:brightness-110 disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      )}

      {message && (
        <p
          role="status"
          className={`rounded-lg border border-border-base bg-background px-3 py-2 text-sm ${
            isSuccess ? "text-green-600" : "text-foreground"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
