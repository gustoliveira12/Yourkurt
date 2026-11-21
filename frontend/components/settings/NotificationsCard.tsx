"use client";

import { BellIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Preferences = {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  follow_accepted: boolean;
};

const OPTIONS: { key: keyof Preferences; label: string }[] = [
  { key: "likes", label: "Curtidas nos meus posts" },
  { key: "comments", label: "Comentários nos meus posts" },
  { key: "follows", label: "Novos seguidores" },
  { key: "follow_accepted", label: "Pedido para seguir aceito" },
];

// Quais avisos a pessoa recebe. Quem decide é o banco: com um tipo desligado,
// o aviso nem é criado.
export default function NotificationsCard() {
  const supabase = useMemo(() => createClient(), []);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error } = await supabase.rpc("get_my_notification_preferences");
      if (!active) return;
      const row = data?.[0];
      if (error || !row) {
        setMessage("Não foi possível carregar suas preferências de notificação.");
        return;
      }
      setPrefs(row);
    }

    void load();
    return () => {
      active = false;
    };
  }, [supabase]);

  async function save(key: keyof Preferences, value: boolean) {
    if (!prefs || isSaving) return;
    const next = { ...prefs, [key]: value };

    setIsSaving(true);
    setMessage("");
    const { error } = await supabase.rpc("set_my_notification_preferences", {
      p_likes: next.likes,
      p_comments: next.comments,
      p_follows: next.follows,
      p_follow_accepted: next.follow_accepted,
    });
    setIsSaving(false);

    if (error) {
      setMessage("Não foi possível salvar. Tente novamente.");
      return;
    }
    setPrefs(next);
    setMessage("Preferência salva.");
  }

  return (
    <div className="rounded-card border border-border-base bg-surface p-4 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-background p-2 text-foreground-brand">
          <BellIcon size={18} weight="fill" />
        </span>
        <div className="flex flex-col">
          <h3 className="text-base font-semibold text-foreground">Notificações</h3>
          <p className="text-sm text-subtitle">Escolha quais avisos você quer receber no Yourkurt.</p>
        </div>
      </div>

      {/* Sem as preferências reais (carregando ou erro), as caixas não aparecem:
          mostrar tudo marcado contradiria o que a pessoa salvou. */}
      {prefs
        ? OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 rounded-lg border border-border-base p-3">
              <input
                type="checkbox"
                checked={prefs[key]}
                disabled={isSaving}
                onChange={(e) => void save(key, e.target.checked)}
                className="size-4 accent-background-brand cursor-pointer"
              />
              <span className="text-sm font-semibold text-foreground">{label}</span>
            </label>
          ))
        : !message && <p className="text-sm text-subtitle">Carregando preferências...</p>}

      <p className="text-sm text-subtitle">
        Pedidos para seguir sempre chegam: num perfil privado, é por eles que você aprova quem pode
        ver seus posts.
      </p>

      {message && (
        <p role="status" className="text-sm text-subtitle">
          {message}
        </p>
      )}
    </div>
  );
}
