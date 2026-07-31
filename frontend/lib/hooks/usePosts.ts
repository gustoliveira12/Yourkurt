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
  image_urls?: string[] | null;
  created_at: string;
  likes_count: number;
};

type RawProfile = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
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
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      const rawPosts = data as unknown as RawPost[];
      const uniqueUserIds = Array.from(new Set(rawPosts.map((item) => item.user_id)));

      let profilesById = new Map<string, PostAuthor>();

      if (uniqueUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", uniqueUserIds);

        if (profilesData) {
          profilesById = new Map(
            (profilesData as unknown as RawProfile[]).map((profile) => [
              profile.id,
              {
                name: profile.name,
                username: profile.username,
                avatar_url: profile.avatar_url,
              },
            ]),
          );
        }
      }

      const mappedPosts = rawPosts.map((item) => ({
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
              profiles: profilesById.get(item.user_id) ?? null,
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
