"use client";

import { COMMUNITY_COLUMNS, type Community } from "@/lib/communities";
import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useRef, useState } from "react";

const supabase = createClient();

export type CommunityRole = "owner" | "moderator" | "member";

export function useCommunity(slug: string) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [role, setRole] = useState<CommunityRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  // Trava síncrona: dois cliques seguidos não disparam duas chamadas.
  const busyRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setNotFound(false);
      setError(null);
      setCommunity(null);
      setRole(null);

      const { data, error: communityError } = await supabase
        .from("communities")
        .select(COMMUNITY_COLUMNS)
        .eq("slug", slug)
        .maybeSingle<Community>();
      if (!active) return;
      if (communityError) {
        console.error("Erro ao carregar a comunidade:", communityError);
        setError("Não foi possível carregar a comunidade. Tente novamente.");
        setLoading(false);
        return;
      }
      // A RLS esconde comunidades pendentes ou recusadas de quem não é o criador nem admin.
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setUserId(user?.id ?? null);

      if (user) {
        const { data: membership, error: membershipError } = await supabase
          .from("community_memberships")
          .select("role")
          .eq("community_id", data.id)
          .eq("user_id", user.id)
          .maybeSingle<{ role: CommunityRole }>();
        if (!active) return;
        if (membershipError) {
          console.error("Erro ao carregar a participação:", membershipError);
          setError("Não foi possível carregar sua participação. Tente novamente.");
        } else {
          setRole(membership?.role ?? null);
        }
      }
      setCommunity(data);
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [slug]);

  const join = useCallback(async () => {
    if (!community || !userId || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);

    const { error: joinError } = await supabase
      .from("community_memberships")
      .insert({ community_id: community.id, user_id: userId, role: "member" });

    if (joinError && joinError.code !== "23505") {
      console.error("Erro ao entrar na comunidade:", joinError);
      setError("Não foi possível entrar na comunidade. Tente novamente.");
    } else {
      // 23505: a pessoa já era membro, então conta como sucesso (sem somar de novo).
      if (!joinError) {
        setCommunity((previous) =>
          previous ? { ...previous, members_count: previous.members_count + 1 } : previous,
        );
      }
      setRole("member");
    }
    busyRef.current = false;
    setBusy(false);
  }, [community, userId]);

  const leave = useCallback(async () => {
    if (!community || !userId || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);

    const { data, error: leaveError } = await supabase
      .from("community_memberships")
      .delete()
      .eq("community_id", community.id)
      .eq("user_id", userId)
      .select("user_id");

    // A RLS não gera erro quando filtra (ex.: dono não sai): 0 linhas apagadas é falha.
    if (leaveError || !data || data.length === 0) {
      console.error("Erro ao sair da comunidade:", leaveError);
      setError("Não foi possível sair da comunidade. Tente novamente.");
    } else {
      setRole(null);
      setCommunity((previous) =>
        previous
          ? { ...previous, members_count: Math.max(0, previous.members_count - 1) }
          : previous,
      );
    }
    busyRef.current = false;
    setBusy(false);
  }, [community, userId]);

  return { community, role, loading, notFound, error, busy, join, leave };
}
