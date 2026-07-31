"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";

export type ReplyAuthor = {
  name: string;
  username: string;
  avatar_url: string | null;
};

export type ReplyPost = {
  id: string;
  content: string;
  image_url: string | null;
  image_urls: string[] | null;
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

export function useUserReplies(userId: string) {
  const [replies, setReplies] = useState<UserReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReplies = useCallback(async () => {
    if (!userId) {
      setReplies([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("comments")
      .select(
        "id, post_id, user_id, content, created_at, posts(id, content, image_url, image_urls, profiles(name, username, avatar_url))",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(60);

    if (fetchError) {
      setError(fetchError.message);
      setReplies([]);
      setLoading(false);
      return;
    }

    const mappedReplies = (data as RawReply[] | null ?? []).map((item) => ({
      id: item.id,
      post_id: item.post_id,
      user_id: item.user_id,
      content: item.content,
      created_at: item.created_at,
      posts: normalizeReplyPost(item.posts),
    }));

    setReplies(mappedReplies);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchReplies();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchReplies]);

  return { replies, loading, error, refetch: fetchReplies };
}
