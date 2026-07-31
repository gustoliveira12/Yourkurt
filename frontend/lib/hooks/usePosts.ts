"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";

export type PostAuthor = {
  name: string;
  username: string;
  avatar_url: string | null;
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  image_urls: string[];
  created_at: string;
  likes_count: number;
  profiles: PostAuthor | null;
};

type RawPost = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  image_urls: string[] | null;
  created_at: string;
  likes_count: number;
  profiles: PostAuthor | PostAuthor[] | null;
};

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const buildPostsQuery = (includeMultipleImages: boolean) =>
      supabase
        .from("posts")
        .select(
          includeMultipleImages
            ? "id, user_id, content, image_url, image_urls, created_at, likes_count, profiles(name, username, avatar_url)"
            : "id, user_id, content, image_url, created_at, likes_count, profiles(name, username, avatar_url)",
        )
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(50);

    let queryResult = await buildPostsQuery(true);

    if (queryResult.error?.message.toLowerCase().includes("image_urls")) {
      queryResult = await buildPostsQuery(false);
    }

    const { data, error } = queryResult;

    if (!error && data) {
      const mappedPosts = (data as Array<RawPost & { image_urls?: string[] | null }>).map((item) => ({
        id: item.id,
        user_id: item.user_id,
        content: item.content,
        image_url: item.image_url,
        image_urls:
          Array.isArray(item.image_urls) && item.image_urls.length > 0
            ? item.image_urls
            : item.image_url
              ? [item.image_url]
              : [],
        created_at: item.created_at,
        likes_count: item.likes_count,
        profiles: item.profiles && Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
      }));

      setPosts(mappedPosts);
    } else if (error) {
      setError(error.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchPosts();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [fetchPosts]);

  const addPost = useCallback(
    (post: Post) => {
      setPosts((prev) => [post, ...prev]);
    },
    [],
  );

  const deletePost = useCallback(async (postId: string) => {
    if (!postId || deletingPostId) return false;

    setDeletingPostId(postId);
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      setError(deleteError.message || "Erro ao apagar post.");
      setDeletingPostId(null);
      return false;
    }

    setPosts((prev) => prev.filter((post) => post.id !== postId));
    setDeletingPostId(null);
    return true;
  }, [deletingPostId]);

  return {
    posts,
    loading,
    error,
    deletingPostId,
    refetch: fetchPosts,
    addPost,
    deletePost,
  };
}
