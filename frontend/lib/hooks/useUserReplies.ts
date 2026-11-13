"use client";

import { createClient } from "@/lib/supabase/client";
import type { PostMedia } from "@/lib/hooks/usePosts";
import { useCallback, useEffect, useState } from "react";

export type ReplyAuthor = {
  name: string;
  username: string;
  avatar_url: string | null;
};

export type ReplyPost = {
  id: string;
  content: string;
  media?: PostMedia[] | null;
  profiles: ReplyAuthor | ReplyAuthor[] | null;
};

export type UserReply = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  posts: ReplyPost | null;
};

type RawReply = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  posts: ReplyPost | ReplyPost[] | null;
};

function normalizeReplyPost(post: ReplyPost | ReplyPost[] | null) {
  if (!post) return null;
  return Array.isArray(post) ? post[0] ?? null : post;
}

// Result of the last fetch, tagged with the request it answers.
// `loading` is derived from it, so the effect never sets state synchronously.
type RepliesState = {
  userId: string;
  reload: number;
  replies: UserReply[];
  error: string | null;
};

const NO_REPLIES: UserReply[] = [];

export function useUserReplies(userId: string) {
  const [reload, setReload] = useState(0);
  const [state, setState] = useState<RepliesState | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function loadReplies() {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("comments")
        .select<string, RawReply>(
          "id, post_id, user_id, content, created_at, posts(id, content, media:post_media(*), profiles(name, username, avatar_url))",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(60);

      if (!active) return;

      if (fetchError) {
        setState({ userId, reload, replies: [], error: fetchError.message });
        return;
      }

      const mappedReplies = (data ?? []).map((item) => ({
        id: item.id,
        post_id: item.post_id,
        user_id: item.user_id,
        content: item.content,
        created_at: item.created_at,
        posts: normalizeReplyPost(item.posts),
      }));

      setState({ userId, reload, replies: mappedReplies, error: null });
    }

    void loadReplies();
    return () => {
      active = false;
    };
  }, [userId, reload]);

  const current = state?.userId === userId && state.reload === reload ? state : null;

  const refetch = useCallback(() => setReload((n) => n + 1), []);

  return {
    replies: current?.replies ?? NO_REPLIES,
    loading: Boolean(userId) && !current,
    error: current?.error ?? null,
    refetch,
  };
}
