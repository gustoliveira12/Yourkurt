"use client";

import { DownloadSimpleIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Preferences = {
  id: string;
  isPrivate: boolean;
  receiveUpdates: boolean;
};

// Privacidade do perfil, consentimento para novidades e exportação dos dados
// (direitos de acesso e portabilidade da LGPD, art. 18).
export default function PrivacyCard() {
  const supabase = useMemo(() => createClient(), []);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error } = await supabase.rpc("get_my_profile");
      if (!active) return;
      const row = data?.[0];
      if (error || !row) {
        setMessage("Não foi possível carregar suas preferências de privacidade.");
        return;
      }
      setPrefs({
        id: row.id,
        isPrivate: row.profile_visibility === "private",
        receiveUpdates: Boolean(row.receive_product_updates),
      });
    }

    void load();
    return () => {
      active = false;
    };
  }, [supabase]);

  async function save(changes: Partial<Omit<Preferences, "id">>) {
    if (!prefs || isSaving) return;
    const next = { ...prefs, ...changes };

    setIsSaving(true);
    setMessage("");
    const { error } = await supabase
      .from("profiles")
      .update({
        profile_visibility: next.isPrivate ? "private" : "public",
        receive_product_updates: next.receiveUpdates,
      })
      .eq("id", prefs.id);
    setIsSaving(false);

    if (error) {
      setMessage("Não foi possível salvar. Tente novamente.");
      return;
    }

    setPrefs(next);
    if (changes.isPrivate === false && prefs.isPrivate) {
      setMessage("Seu perfil agora é público. Pedidos para seguir pendentes foram aceitos.");
    } else {
      setMessage("Preferência salva.");
    }
  }

  async function exportData() {
    if (isExporting) return;
    setIsExporting(true);
    setMessage("");

    const { data, error } = await supabase.rpc("export_my_data");
    setIsExporting(false);

    if (error || !data) {
      setMessage("Não foi possível gerar o arquivo. Tente novamente.");
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `yourkurt-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-card border border-border-base bg-surface p-4 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-background p-2 text-foreground-brand">
          <ShieldCheckIcon size={18} weight="fill" />
        </span>
        <div className="flex flex-col">
          <h3 className="text-base font-semibold text-foreground">Privacidade e dados</h3>
          <p className="text-sm text-subtitle">
            Controle quem vê seu perfil e baixe uma cópia dos seus dados.{" "}
            <Link href="/privacidade" className="font-semibold text-foreground-brand underline">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-border-base p-3">
        <input
          type="checkbox"
          checked={prefs?.isPrivate ?? false}
          disabled={!prefs || isSaving}
          onChange={(e) => void save({ isPrivate: e.target.checked })}
          className="mt-1 size-4 accent-background-brand cursor-pointer"
        />
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">Perfil privado</span>
          <span className="text-sm text-subtitle">
            Só quem você aprovar vê seus posts, bio, localização, site e aniversário. Nome, @,
            foto e capa continuam visíveis.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-lg border border-border-base p-3">
        <input
          type="checkbox"
          checked={prefs?.receiveUpdates ?? false}
          disabled={!prefs || isSaving}
          onChange={(e) => void save({ receiveUpdates: e.target.checked })}
          className="mt-1 size-4 accent-background-brand cursor-pointer"
        />
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">Receber novidades por e-mail</span>
          <span className="text-sm text-subtitle">
            Avisos sobre recursos novos. Você pode desmarcar quando quiser.
          </span>
        </span>
      </label>

      <button
        type="button"
        onClick={() => void exportData()}
        disabled={isExporting}
        className="self-start inline-flex items-center gap-2 rounded-lg border border-border-base px-3 py-2 text-sm font-semibold text-foreground hover:bg-background disabled:opacity-60"
      >
        <DownloadSimpleIcon size={16} weight="bold" />
        {isExporting ? "Gerando arquivo..." : "Baixar meus dados"}
      </button>

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
