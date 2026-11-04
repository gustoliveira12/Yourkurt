"use client";

import { TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { getAuthErrorMessage } from "@/lib/password";
import { createClient } from "@/lib/supabase/client";

function normalizeHandle(value: string) {
  return value.trim().replace(/^@/, "");
}

const inputClass =
  "w-full rounded-lg border border-border-base bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-400/30";

function getDeleteErrorMessage(rawMessage: string) {
  if (rawMessage.includes("owns_resources")) {
    return "Você é dono de comunidades ou páginas de equipe. Exclua ou transfira esses itens antes de apagar a conta.";
  }

  if (rawMessage.includes("super_admin_cannot_delete")) {
    return "Super administradores não podem excluir a própria conta.";
  }

  if (rawMessage.includes("invalid_password")) {
    return "Senha incorreta.";
  }

  if (rawMessage.includes("not_authenticated")) {
    return "Sua sessão expirou. Entre novamente.";
  }

  return "Não foi possível excluir a conta. Tente novamente.";
}

type SupabaseClient = ReturnType<typeof createClient>;

// O banco não consegue apagar arquivos do Storage, então removemos as imagens
// dos posts do usuário antes de apagar a conta.
async function removePostImages(supabase: SupabaseClient, userId: string) {
  const pageSize = 100;
  for (;;) {
    const { data, error } = await supabase
      .from("post_media")
      .select("storage_path")
      .like("storage_path", `${userId}/%`)
      .limit(pageSize);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return;

    const paths = data.map((item) => item.storage_path);
    const { error: removeError } = await supabase.storage
      .from("post-images")
      .remove(paths);
    if (removeError) throw new Error(removeError.message);

    const { error: deleteError } = await supabase
      .from("post_media")
      .delete()
      .in("storage_path", paths);
    if (deleteError) throw new Error(deleteError.message);
  }
}

export default function DeleteAccountCard({ username }: { username: string }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");

  const canSubmit =
    Boolean(username) &&
    password.length > 0 &&
    normalizeHandle(confirmText) === normalizeHandle(username) &&
    !isDeleting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsDeleting(true);
    setMessage("");

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData.user;
      if (userError || !user?.email) {
        throw new Error("not_authenticated");
      }

      // Evita apagar arquivos de quem errou a senha. A RPC valida a senha de novo.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });
      if (verifyError) {
        setMessage(
          verifyError.code === "invalid_credentials"
            ? "Senha incorreta."
            : getAuthErrorMessage(verifyError.message),
        );
        return;
      }

      const { error: checkError } = await supabase.rpc(
        "check_my_account_deletable",
      );
      if (checkError) {
        setMessage(getDeleteErrorMessage(checkError.message));
        return;
      }

      await removePostImages(supabase, user.id);

      const { error: deleteError } = await supabase.rpc("delete_my_account", {
        p_password: password,
      });
      if (deleteError) {
        setMessage(getDeleteErrorMessage(deleteError.message));
        return;
      }

      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setMessage(
        getDeleteErrorMessage(error instanceof Error ? error.message : ""),
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="rounded-xl border border-red-300 bg-background-raised p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg bg-red-50 p-2 text-red-700">
            <TrashIcon size={18} weight="fill" />
          </span>
          <div className="flex flex-col">
            <h3 className="text-base font-semibold text-foreground">
              Excluir conta
            </h3>
            <p className="text-sm text-subtitle">
              Apague sua conta e seus dados de forma permanente. Essa ação não
              pode ser desfeita.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => {
            setIsOpen((open) => !open);
            setMessage("");
          }}
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOpen ? "Cancelar" : "Excluir"}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            Suas publicações, comentários, mensagens e amizades serão apagados
            permanentemente.
          </p>

          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            Sua senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={inputClass}
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            Digite seu @ (@{username}) para confirmar
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`@${username}`}
              autoComplete="off"
              className={inputClass}
              required
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="self-start rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? "Excluindo..." : "Excluir minha conta"}
          </button>
        </form>
      )}

      {message && (
        <p
          role="status"
          className="rounded-lg border border-border-base bg-background px-3 py-2 text-sm text-foreground"
        >
          {message}
        </p>
      )}
    </div>
  );
}
