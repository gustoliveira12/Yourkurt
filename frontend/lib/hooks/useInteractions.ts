"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";

const supabase = createClient();

export type Interactions = {
  commentsCount: number;
  repostsCount: number;
};

export function useInteractions(postId: string) {
  const [interactions, setInteractions] = useState<Interactions>({
    commentsCount: 0,
    repostsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInteractions = useCallback(async () => {
    setLoading(true);
    setError(null);

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

    if (commentsError || repostsError) {
      setError(
        commentsError?.message ??
          repostsError?.message ??
          "Erro ao carregar interações.",
      );
    }

    setInteractions({
      commentsCount: commentsCount ?? 0,
      repostsCount: repostsCount ?? 0,
    });
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    void fetchInteractions();
  }, [fetchInteractions]);

  return { interactions, loading, error };
}
