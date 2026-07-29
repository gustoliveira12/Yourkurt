"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function useLikes(postId: string, initialLikesCount: number) {
  const supabase = createClient();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user and check if they liked this post
  useEffect(() => {
    async function loadLikeStatus() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // Check if user has liked this post
      const { data } = await supabase
        .from("reactions")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      setLiked(!!data);
      setLoading(false);
    }

    void loadLikeStatus();
  }, [postId]);

  async function toggleLike() {
    if (!userId) return;

    if (liked) {
      // Optimistic update first
      setLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));

      const { error } = await supabase
        .from("reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      // Revert on error
      if (error) {
        setLiked(true);
        setLikesCount((prev) => prev + 1);
      }
      // DB trigger (sync_post_likes_count) handles likes_count update automatically
    } else {
      // Optimistic update first
      setLiked(true);
      setLikesCount((prev) => prev + 1);

      const { error } = await supabase.from("reactions").insert({
        post_id: postId,
        user_id: userId,
        type: "like",
      });

      // Revert on error
      if (error) {
        setLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      }
      // DB trigger (sync_post_likes_count) handles likes_count update automatically
    }
  }

  return { liked, likesCount, loading, toggleLike };
}
