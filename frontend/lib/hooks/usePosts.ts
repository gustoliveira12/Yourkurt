"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useRef, useState } from "react";

const supabase = createClient();

export type PostAuthor = {
  name: string;
  username: string;
  avatar_url: string | null;
};

export type PostMedia = {
  id: string;
  post_id: string;
  storage_path: string;
  media_type: "image" | "video";
  created_at: string;
  public_url?: string;
};

export type Post = {
  id: string;
  user_id: string;
  author_team_page_id: string | null;
  community_id: string | null;
  content: string;
  media: PostMedia[];
  created_at: string;
  likes_count: number;
  profiles: PostAuthor | null;
};

type RawPost = {
  id: string;
  user_id: string;
  author_team_page_id?: string | null;
  community_id?: string | null;
  content: string;
  media?: PostMedia[] | null;
  created_at: string;
  likes_count: number;
};

type RawProfile = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
};

type RawTeamPage = {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
};

export function usePosts(authorId?: string | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchPosts = useCallback(async () => {
    if (authorId === null) return;
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    let query = supabase
      .from("posts")
      .select<string, RawPost>("*, media:post_media(*)")
      .eq("is_public", true);

    if (authorId !== undefined) {
      query = query.eq("user_id", authorId);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      const rawPosts = data;
      const uniqueUserIds = Array.from(new Set(rawPosts.map((item) => item.user_id)));
      const uniqueTeamPageIds = Array.from(
        new Set(
          rawPosts
            .map((item) => item.author_team_page_id)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      let profilesById = new Map<string, PostAuthor>();
      let teamPagesById = new Map<string, PostAuthor>();

      if (uniqueUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select<string, RawProfile>("*")
          .in("id", uniqueUserIds);

        if (profilesData) {
          profilesById = new Map(
            profilesData.map((profile) => [
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

      if (uniqueTeamPageIds.length > 0) {
        const { data: teamPagesData } = await supabase
          .from("team_pages")
          .select<string, RawTeamPage>("id, name, slug, avatar_url")
          .in("id", uniqueTeamPageIds);

        if (teamPagesData) {
          teamPagesById = new Map(
            teamPagesData.map((teamPage) => [
              teamPage.id,
              {
                name: teamPage.name,
                username: teamPage.slug,
                avatar_url: teamPage.avatar_url,
              },
            ]),
          );
        }
      }

const mappedPosts = rawPosts.map((item) => {
        const media =
          item.media?.map((m) => ({
            ...m,
            public_url: supabase.storage.from("post-images").getPublicUrl(m.storage_path)
              .data.publicUrl,
          })) ?? [];

        return {
          id: item.id,
          user_id: item.user_id,
          author_team_page_id: item.author_team_page_id ?? null,
          community_id: item.community_id ?? null,
          content: item.content,
          media,
          created_at: item.created_at,
          likes_count: item.likes_count,
          profiles:
            (item.author_team_page_id
              ? teamPagesById.get(item.author_team_page_id)
              : null) ?? profilesById.get(item.user_id) ?? null,
        };
      });

      if (currentRequest !== requestId.current) return;
      setPosts(mappedPosts);
    } else if (error) {
      if (currentRequest !== requestId.current) return;
      setError(error.message);
    }
    setLoading(false);
  }, [authorId]);

useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPosts();
    return () => { requestId.current += 1; };
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
