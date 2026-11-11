"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";

export type CommentAuthor = {
  name: string;
  username: string;
  avatar_url: string | null;
};

export type CommentItem = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: CommentAuthor | null;
};

type RawComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: CommentAuthor | CommentAuthor[] | null;
};

// Result of the last fetch, tagged with the request it answers.
// `loading` is derived from it, so the effect never sets state synchronously.
type CommentsState = {
  postId: string;
  reload: number;
  comments: CommentItem[];
  error: string | null;
};

const NO_COMMENTS: CommentItem[] = [];

export function useComments(postId: string) {
  const [reload, setReload] = useState(0);
  const [state, setState] = useState<CommentsState | null>(null);

  useEffect(() => {
    if (!postId) return;
    let active = true;

    async function loadComments() {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("comments")
        .select<string, RawComment>(
          "id, post_id, user_id, content, created_at, profiles(name, username, avatar_url)",
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (!active) return;

      if (fetchError) {
        setState({ postId, reload, comments: [], error: fetchError.message });
        return;
      }

      const mappedComments = (data ?? []).map((item) => ({
        id: item.id,
        post_id: item.post_id,
        user_id: item.user_id,
        content: item.content,
        created_at: item.created_at,
        profiles:
          item.profiles && Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
      }));

      setState({ postId, reload, comments: mappedComments, error: null });
    }

    void loadComments();
    return () => {
      active = false;
    };
  }, [postId, reload]);

  const current = state?.postId === postId && state.reload === reload ? state : null;

  const refetch = useCallback(() => setReload((n) => n + 1), []);

  const addComment = useCallback((comment: CommentItem) => {
    setState((prev) => prev && { ...prev, comments: [...prev.comments, comment] });
  }, []);

  return {
    comments: current?.comments ?? NO_COMMENTS,
    loading: Boolean(postId) && !current,
    error: current?.error ?? null,
    refetch,
    addComment,
  };
}
