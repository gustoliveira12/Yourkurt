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

export function useComments(postId: string) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!postId) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data, error: fetchError } = await supabase
      .from("comments")
      .select(
        "id, post_id, user_id, content, created_at, profiles(name, username, avatar_url)",
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setComments([]);
      setLoading(false);
      return;
    }

    const mappedComments = (data as RawComment[] | null ?? []).map((item) => ({
      id: item.id,
      post_id: item.post_id,
      user_id: item.user_id,
      content: item.content,
      created_at: item.created_at,
      profiles:
        item.profiles && Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
    }));

    setComments(mappedComments);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchComments();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [fetchComments]);

  const addComment = useCallback((comment: CommentItem) => {
    setComments((prev) => [...prev, comment]);
  }, []);

  return { comments, loading, error, refetch: fetchComments, addComment };
}
