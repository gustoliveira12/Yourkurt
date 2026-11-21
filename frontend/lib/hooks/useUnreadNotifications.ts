"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const supabase = createClient();

// Disparado pela tela de Notificações depois de marcar tudo como lido, para a
// bolinha do sino zerar sem esperar a próxima navegação.
export const NOTIFICATIONS_READ_EVENT = "yourkurt:notifications-read";

export function announceNotificationsRead() {
  lastCount = 0;
  window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT));
}

// O menu lateral e o cabeçalho do celular são montados juntos em toda página
// e os dois usam este hook: chamadas simultâneas reaproveitam a mesma
// consulta, para cada carregamento fazer uma contagem só.
let inflight: Promise<number | null> | null = null;

// Último valor conhecido. O menu é montado de novo a cada página: começar dele,
// e não de zero, evita que a bolinha suma e volte enquanto a contagem não chega.
// No primeiro carregamento ele ainda é 0, igual ao HTML vindo do servidor.
let lastCount = 0;

async function countUnread(): Promise<number | null> {
  // getSession lê a sessão salva no navegador, sem ida ao servidor.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user.id;
  if (!userId) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    console.error("Erro ao contar notificações não lidas:", error);
    return null;
  }
  return count ?? 0;
}

function fetchUnread(): Promise<number | null> {
  inflight ??= countUnread().finally(() => {
    inflight = null;
  });
  return inflight;
}

/**
 * Quantidade de notificações não lidas da pessoa logada (0 sem sessão).
 * Atualiza ao montar (toda troca de página) e quando a aba volta a ficar
 * visível. Em erro, mantém o último valor.
 */
export function useUnreadNotifications(): number {
  const [count, setCount] = useState(lastCount);

  useEffect(() => {
    let active = true;

    async function refresh() {
      const next = await fetchUnread();
      if (next === null) return;
      lastCount = next;
      if (active) setCount(next);
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void refresh();
    }

    function onRead() {
      setCount(0);
    }

    void refresh();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener(NOTIFICATIONS_READ_EVENT, onRead);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener(NOTIFICATIONS_READ_EVENT, onRead);
    };
  }, []);

  return count;
}
