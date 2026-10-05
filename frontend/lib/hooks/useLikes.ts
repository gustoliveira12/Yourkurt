"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const supabase = createClient();

export function useLikes(postId: string, initialLikesCount: number) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);

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

      const { data } = await supabase
        .from("reactions")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .eq("type", "like")
        .maybeSingle();

      setLiked(!!data);
      setLoading(false);
    }

    void loadLikeStatus();
  }, [postId]);

  async function toggleLike() {
    if (!userId || isToggling) return;

    setIsToggling(true);

    if (liked) {
      setLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));

      const { error } = await supabase
        .from("reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId)
        .eq("type", "like");

      if (error) {
        setLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } else {
      setLiked(true);
      setLikesCount((prev) => prev + 1);

      const { error } = await supabase.from("reactions").insert({
        post_id: postId,
        user_id: userId,
        type: "like",
      });
      if (error) {
        setLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      }
    }

    setIsToggling(false);
  }

  return { liked, likesCount, loading, toggleLike, isToggling };
}
