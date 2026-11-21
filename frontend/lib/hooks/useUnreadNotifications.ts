"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const supabase = createClient();

// Disparado pela tela de Notificações depois de marcar tudo como lido, para a
// bolinha do sino se atualizar sem esperar a próxima navegação.
export const NOTIFICATIONS_READ_EVENT = "yourkurt:notifications-read";

// O menu lateral e o cabeçalho do celular são montados juntos em toda página
// e os dois usam este hook: chamadas simultâneas reaproveitam a mesma
// consulta, para cada carregamento fazer uma contagem só.
let inflight: Promise<number | null> | null = null;

// Último valor conhecido. O menu é montado de novo a cada página: começar dele,
// e não de zero, evita que a bolinha suma e volte enquanto a contagem não chega.
// No primeiro carregamento ele ainda é 0, igual ao HTML vindo do servidor.
let lastCount = 0;

// Muda quando o valor conhecido deixa de valer (tudo marcado como lido, ou
// a pessoa saiu da conta). Uma contagem que começou antes é descartada, para
// não pôr um número velho de volta na bolinha.
let generation = 0;

function resetUnreadState() {
  generation += 1;
  inflight = null;
  lastCount = 0;
}

// Ao sair da conta, a próxima pessoa no mesmo navegador não pode ver, nem por
// um instante, a contagem da anterior.
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") resetUnreadState();
  });
}

export function announceNotificationsRead() {
  resetUnreadState();
  window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT));
}

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
  if (!inflight) {
    const request = countUnread().finally(() => {
      if (inflight === request) inflight = null;
    });
    inflight = request;
  }
  return inflight;
}

/**
 * Quantidade de notificações não lidas da pessoa logada (0 sem sessão).
 * Atualiza ao montar (toda troca de página), quando a aba volta a ficar
 * visível e depois que a tela de Notificações marca tudo como lido. Em erro,
 * mantém o último valor.
 */
export function useUnreadNotifications(): number {
  const [count, setCount] = useState(lastCount);

  useEffect(() => {
    let active = true;

    async function refresh() {
      const startedAt = generation;
      const next = await fetchUnread();
      if (next === null || startedAt !== generation) return;
      lastCount = next;
      if (active) setCount(next);
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void refresh();
    }

    // Zera na hora e conta de novo: um aviso que chegou enquanto a tela
    // carregava continua não lido e precisa aparecer.
    function onRead() {
      setCount(0);
      void refresh();
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
