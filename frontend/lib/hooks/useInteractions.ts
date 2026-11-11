"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const supabase = createClient();

export type Interactions = {
  commentsCount: number;
  repostsCount: number;
};

// Result of the last fetch, tagged with the post it answers.
// `loading` is derived from it, so the effect never sets state synchronously.
type InteractionsState = {
  postId: string;
  interactions: Interactions;
  error: string | null;
};

const NO_INTERACTIONS: Interactions = { commentsCount: 0, repostsCount: 0 };

export function useInteractions(postId: string) {
  const [state, setState] = useState<InteractionsState | null>(null);

  useEffect(() => {
    let active = true;

    async function loadInteractions() {
      // Count comments
      const { count: commentsCount, error: commentsError } = await supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("post_id", postId);

      // Count reposts (reactions with type='repost')
      const { count: repostsCount, error: repostsError } = await supabase
        .from("reactions")
        .select("id", { count: "exact", head: true })
        .eq("post_id", postId)
        .eq("type", "repost");

      if (!active) return;

      setState({
        postId,
        interactions: {
          commentsCount: commentsCount ?? 0,
          repostsCount: repostsCount ?? 0,
        },
        error:
          commentsError || repostsError
            ? (commentsError?.message ??
              repostsError?.message ??
              "Erro ao carregar interações.")
            : null,
      });
    }

    void loadInteractions();
    return () => {
      active = false;
    };
  }, [postId]);

  const current = state?.postId === postId ? state : null;

  return {
    interactions: current?.interactions ?? NO_INTERACTIONS,
    loading: !current,
    error: current?.error ?? null,
  };
}
