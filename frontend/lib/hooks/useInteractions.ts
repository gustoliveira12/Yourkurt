"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";

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

  const fetchInteractions = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    // Count comments
    const { count: commentsCount } = await supabase
      .from("comments")
      .select("id", { count: "exact" })
      .eq("post_id", postId);

    // Count reposts (reactions with type='repost')
    const { count: repostsCount } = await supabase
      .from("reactions")
      .select("id", { count: "exact" })
      .eq("post_id", postId)
      .eq("type", "repost");

    setInteractions({
      commentsCount: commentsCount ?? 0,
      repostsCount: repostsCount ?? 0,
    });
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    void fetchInteractions();
  }, [fetchInteractions]);

  return { interactions, loading };
}
