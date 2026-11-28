"use client";

import { LockKeyIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage, validateNewPassword } from "@/lib/password";
import CollapsibleCard from "./CollapsibleCard";

const inputClass =
  "w-full rounded-lg border border-border-base bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30";

export default function ChangePasswordCard() {
  const supabase = useMemo(() => createClient(), []);
  const [currentEmail, setCurrentEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setCurrentEmail(data.user?.email ?? "");
    });
    return () => {
      active = false;
    };
  }, [supabase]);

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
    <CollapsibleCard
      icon={<LockKeyIcon size={18} weight="fill" />}
      title="Senha e e-mail"
      description="Altere sua senha e o e-mail que você usa para entrar."
      onToggle={(open) => {
        // Como no botão antigo: abrir ou fechar limpa o aviso anterior. Ao
        // fechar, as senhas digitadas também saem da memória da tela.
        setMessage("");
        setIsSuccess(false);
        if (!open) reset();
      }}
    >
      <section aria-labelledby="alterar-senha" className="flex flex-col gap-3">
        <h4 id="alterar-senha" className="text-sm font-semibold text-foreground">
          Alterar senha
        </h4>
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
      </section>

      {/* Placeholder: a troca de e-mail ainda não está ligada ao Supabase Auth.
          Quando entrar, precisa confirmar a senha e o novo endereço por e-mail. */}
      <section
        aria-labelledby="alterar-email"
        className="flex flex-col gap-3 border-t border-border-base pt-4"
      >
        <div className="flex items-center gap-2">
          <h4 id="alterar-email" className="text-sm font-semibold text-foreground">
            Alterar e-mail
          </h4>
          <span className="rounded-full border border-border-base px-2 py-0.5 text-xs font-semibold text-subtitle">
            Em breve
          </span>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          E-mail atual
          <input
            type="email"
            value={currentEmail}
            readOnly
            className={`${inputClass} opacity-70`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Novo e-mail
          <input
            type="email"
            placeholder="nome@exemplo.com"
            disabled
            aria-describedby="alterar-email-aviso"
            className={`${inputClass} cursor-not-allowed opacity-60`}
          />
        </label>
        <p id="alterar-email-aviso" className="text-sm text-subtitle">
          Em breve você poderá trocar o e-mail da sua conta por aqui. Um link de confirmação será
          enviado para o novo endereço.
        </p>
        <button
          type="button"
          disabled
          className="self-start rounded-lg border border-border-base px-4 py-2 text-sm font-semibold text-foreground cursor-not-allowed opacity-60"
        >
          Alterar e-mail
        </button>
      </section>
    </CollapsibleCard>
  );
}
