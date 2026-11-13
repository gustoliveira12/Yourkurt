"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export type FollowListKind = "friends" | "followers" | "following";

export type FollowPerson = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  /** Seu seguimento para a pessoa: "pending" só aparece em "following". */
  follow_status: "accepted" | "pending";
  /** Vocês se seguem mutuamente (amigos). */
  is_friend: boolean;
};

type Row = FollowPerson & { total_count: number };

// Resultado da última busca, marcado com a lista que ele responde.
// `loading` é derivado dele, então o efeito nunca chama setState de forma síncrona.
type ListState = {
  key: string;
  people: FollowPerson[];
  total: number;
  error: string | null;
};

const NO_PEOPLE: FollowPerson[] = [];

/**
 * Amigos (seguimento mútuo e aceito), seguidores ou seguindo da pessoa logada.
 * `total` é o tamanho da lista inteira, mesmo quando `limit` corta o resultado.
 */
export function useFollowList(kind: FollowListKind, limit = 100) {
  const key = `${kind}:${limit}`;
  const [state, setState] = useState<ListState | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_my_follow_lists", {
        p_kind: kind,
        p_limit: limit,
      });
      if (!active) return;

      if (error) {
        console.error(`Erro ao carregar a lista (${kind}):`, error);
        setState({ key, people: [], total: 0, error: "Não foi possível carregar a lista." });
        return;
      }

      const rows = (data ?? []) as Row[];
      setState({
        key,
        people: rows.map((row) => ({
          id: row.id,
          name: row.name,
          username: row.username,
          avatar_url: row.avatar_url,
          follow_status: row.follow_status,
          is_friend: row.is_friend,
        })),
        total: Number(rows[0]?.total_count ?? 0),
        error: null,
      });
    }

    void load();
    return () => {
      active = false;
    };
  }, [key, kind, limit]);

  const current = state?.key === key ? state : null;

  return {
    people: current?.people ?? NO_PEOPLE,
    total: current?.total ?? 0,
    loading: !current,
    error: current?.error ?? null,
  };
}

/** Amigos da pessoa logada: quem ela segue e segue ela de volta. */
export function useFriends(limit = 6) {
  const { people, total, loading } = useFollowList("friends", limit);
  return { friends: people, total, loading };
}
