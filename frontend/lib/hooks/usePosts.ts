"use client";

import { createClient } from "@/lib/supabase/client";
import { fetchCommunityBadges, type CommunityBadgeKind } from "@/lib/communities";
import { useCallback, useEffect, useRef, useState } from "react";

const supabase = createClient();

export type PostAuthor = {
  name: string;
  username: string;
  avatar_url: string | null;
  is_test_account?: boolean;
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
  community: { name: string; slug: string } | null;
  author_badge: CommunityBadgeKind | null;
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
  community?: { name: string; slug: string } | { name: string; slug: string }[] | null;
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
  is_test_account?: boolean;
};

type RawTeamPage = {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
};

export type PostsFilter = {
  authorId?: string | null;
  communityId?: string | null;
};

// `null` em qualquer campo do filtro significa "ainda não buscar".
export function usePosts({ authorId, communityId }: PostsFilter = {}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchPosts = useCallback(async () => {
    if (authorId === null || communityId === null) return;
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    let query = supabase
      .from("posts")
      .select<string, RawPost>("*, media:post_media(*), community:communities(name, slug)")
      .eq("is_public", true);

    if (authorId !== undefined) {
      query = query.eq("user_id", authorId);
    }
    if (communityId !== undefined) {
      query = query.eq("community_id", communityId);
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
          .select<string, RawProfile>("id, name, username, avatar_url, is_test_account")
          .in("id", uniqueUserIds);

        if (profilesData) {
          profilesById = new Map(
            profilesData.map((profile) => [
              profile.id,
              {
                name: profile.name,
                username: profile.username,
                avatar_url: profile.avatar_url,
                is_test_account: profile.is_test_account,
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

      // Etiquetas só para posts de comunidade. Se a RPC falhar, o feed segue sem elas.
      let badges = new Map<string, CommunityBadgeKind>();
      const communityPosts = rawPosts.filter((item) => item.community_id);
      if (communityPosts.length > 0) {
        try {
          badges = await fetchCommunityBadges(
            supabase,
            Array.from(new Set(communityPosts.map((item) => item.community_id as string))),
            Array.from(new Set(communityPosts.map((item) => item.user_id))),
          );
        } catch {
          badges = new Map();
        }
      }

      const mappedPosts: Post[] = rawPosts.map((item) => {
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
          community: Array.isArray(item.community) ? (item.community[0] ?? null) : (item.community ?? null),
          author_badge: item.community_id
            ? (badges.get(`${item.community_id}:${item.user_id}`) ?? null)
            : null,
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
  }, [authorId, communityId]);

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
