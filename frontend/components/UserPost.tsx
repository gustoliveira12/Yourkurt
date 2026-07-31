"use client";

import {
  Bookmark,
  Ellipsis,
  Heart,
  Loader2,
  MessageSquare,
  Repeat2,
  Trash2,
} from "lucide-react";
import { Avatar } from "./Avatar";
import Image from "next/image";
import clsx from "clsx";
import { useState } from "react";
import { useLikes } from "@/lib/hooks/useLikes";
import { useInteractions } from "@/lib/hooks/useInteractions";
import type { Post } from "@/lib/hooks/usePosts";

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Agora mesmo";
  if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Há ${Math.floor(diff / 3600)} h`;
  return `Há ${Math.floor(diff / 86400)} dias`;
}

type PostCardProps = {
  post: Post;
  canDelete?: boolean;
  deleting?: boolean;
  onDelete?: (postId: string) => Promise<boolean>;
};

export default function PostCard({
  post,
  canDelete = false,
  deleting = false,
  onDelete,
}: PostCardProps) {
  const [reposted, setReposted] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`reposted-${post.id}`) === "true";
  });
  const [bookmarked, setBookmarked] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`bookmarked-${post.id}`) === "true";
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const { liked, likesCount, toggleLike } = useLikes(post.id, post.likes_count);
  const { interactions, loading: loadingInteractions } = useInteractions(post.id);

  const author = post.profiles;
  const postImages =
    Array.isArray(post.image_urls) && post.image_urls.length > 0
      ? post.image_urls
      : post.image_url
        ? [post.image_url]
        : [];

  // Save reposted state to localStorage
  const handleRepost = () => {
    const newRepostedState = !reposted;
    setReposted(newRepostedState);
    localStorage.setItem(`reposted-${post.id}`, newRepostedState.toString());
  };

  // Save bookmarked state to localStorage
  const handleBookmark = () => {
    const newBookmarkedState = !bookmarked;
    setBookmarked(newBookmarkedState);
    localStorage.setItem(`bookmarked-${post.id}`, newBookmarkedState.toString());
  };

  const handleDelete = async () => {
    if (!canDelete || !onDelete || deleting) return;

    const shouldDelete = window.confirm("Tem certeza que deseja apagar este post?");
    if (!shouldDelete) return;

    const deleted = await onDelete(post.id);
    if (!deleted) {
      alert("Nao foi possivel apagar o post. Tente novamente.");
      return;
    }

    setMenuOpen(false);
  };

  return (
    <div className="flex flex-col md:py-4 md:w-full md:rounded-lg gap-2 w-dvw">
      <div className="flex flex-col gap-4 px-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 ">
            <div>
              <Avatar src={author?.avatar_url ?? null} />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-foreground cursor-pointer">
                {author?.name ?? "Usuário"}
              </h3>
              <div className="flex gap-4 text-subtitle">
                <span>@{author?.username ?? "usuario"}</span>
                <span>{timeAgo(post.created_at)}</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <button
              type="button"
              aria-label="Abrir menu do post"
              onClick={() => setMenuOpen((prev) => !prev)}
              disabled={deleting}
              className="p-2 rounded-sm hover:bg-background transition-all duration-100 ease-out text-foreground cursor-pointer disabled:opacity-60"
            >
              {deleting ? <Loader2 className="animate-spin" /> : <Ellipsis />}
            </button>

            {menuOpen && canDelete && (
              <div className="absolute right-0 top-11 z-20 min-w-40 rounded-lg border border-border-base bg-background-raised p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  Apagar post
                </button>
              </div>
            )}
          </div>
        </div>
        <div>
          <span className="font-medium whitespace-pre-wrap">{post.content}</span>
        </div>
      </div>
      {postImages.length === 1 && (
        <div className="w-full relative max-w-full max-h-96 aspect-video md:rounded-xl overflow-hidden flex justify-center items-center">
          <Image
            className="object-contain"
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            alt="Imagem da publicação"
            src={postImages[0]}
          />
        </div>
      )}
      {postImages.length > 1 && (
        <div className="grid grid-cols-2 gap-2 px-3">
          {postImages.map((url, index) => (
            <div
              key={`${post.id}-image-${index}`}
              className="relative h-40 overflow-hidden rounded-lg border border-border-base bg-background"
            >
              <Image
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 320px"
                alt={`Imagem ${index + 1} da publicacao`}
                src={url}
              />
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2 px-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-6 items-center">
            <button
              onClick={() => void toggleLike()}
              className={clsx(
                "flex gap-2 items-center group cursor-pointer transition-colors duration-150",
                liked
                  ? "text-rose-500 hover:text-rose-600 [&_svg]:fill-rose-500"
                  : "text-foreground dark:hover:text-rose-300 hover:text-rose-600",
              )}
            >
              <Heart />
              <span>{likesCount}</span>
            </button>
            <button
              className={clsx(
                "flex gap-2 items-center hover:text-zinc-600 text-foreground cursor-pointer",
              )}
            >
              <MessageSquare />
              <span>{loadingInteractions ? "..." : interactions.commentsCount}</span>
            </button>
            <button
              onClick={handleRepost}
              className={clsx(
                "flex gap-2 items-center cursor-pointer",
                reposted
                  ? "text-sky-500 fill-sky-500"
                  : "text-foreground dark:hover:text-sky-200 hover:text-sky-600",
              )}
            >
              <Repeat2 />
              <span>{loadingInteractions ? "..." : interactions.repostsCount}</span>
            </button>
          </div>
          <button
            onClick={handleBookmark}
            className="cursor-pointer py-2 px-4 text-foreground rounded-sm hover:bg-background-brand/15 hover:text-foreground-brand transition-all duration-150"
          >
            <Bookmark
              className={clsx(
                bookmarked ? "fill-background-brand text-foreground-brand" : "",
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
