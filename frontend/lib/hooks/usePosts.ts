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
  created_at: string;
  likes_count: number;
  profiles: PostAuthor | null;
};

const supabase = createClient();

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, user_id, content, image_url, created_at, likes_count, profiles(name, username, avatar_url)",
      )
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setPosts(data as Post[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  const addPost = useCallback(
    (post: Post) => {
      setPosts((prev) => [post, ...prev]);
    },
    [],
  );

  return { posts, loading, refetch: fetchPosts, addPost };
}
