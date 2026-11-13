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
import Link from "next/link";
import clsx from "clsx";
import { useState } from "react";
import { useLikes } from "@/lib/hooks/useLikes";
import { useInteractions } from "@/lib/hooks/useInteractions";
import type { Post } from "@/lib/hooks/usePosts";
import { profileHref } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

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
  detailHref?: string;
};

export default function PostCard({
  post,
  canDelete = false,
  deleting = false,
  onDelete,
  detailHref,
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
  const authorName = author?.name ?? "Usuário";
  const commentsLabel = loadingInteractions
    ? "carregando comentários"
    : `${interactions.commentsCount} ${interactions.commentsCount === 1 ? "comentário" : "comentários"}`;
  // Posts de equipe não têm link: ainda não existe tela de equipe.
  const authorHref = post.author_team_page_id ? null : profileHref(author?.username);
  const postImages = post.media
    .filter((item) => item.media_type === "image")
    .map(
      (item) =>
        item.public_url ??
        supabase.storage.from("post-images").getPublicUrl(item.storage_path).data.publicUrl,
    );

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
      alert("Não foi possível apagar o post. Tente novamente.");
      return;
    }

    setMenuOpen(false);
  };

  return (
    <div className="flex flex-col md:py-4 md:w-full md:rounded-card md:bg-surface md:shadow-card gap-2 w-dvw">
      <div className="flex flex-col gap-4 px-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 min-w-0 flex-1">
            {/* Foto e nome levam ao perfil do autor; texto, imagens e hora, ao post. */}
            {authorHref ? (
              <Link href={authorHref} tabIndex={-1} aria-hidden="true" className="shrink-0">
                <Avatar src={author?.avatar_url ?? null} />
              </Link>
            ) : (
              <div className="shrink-0">
                <Avatar src={author?.avatar_url ?? null} />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate">
                {authorHref ? (
                  <Link href={authorHref} className="hover:underline">
                    {authorName}
                  </Link>
                ) : (
                  authorName
                )}
              </h2>
              <div className="flex gap-4 text-subtitle flex-wrap">
                <span>@{author?.username ?? "usuario"}</span>
                {detailHref ? (
                  <Link href={detailHref} className="hover:underline">
                    {timeAgo(post.created_at)}
                  </Link>
                ) : (
                  <span>{timeAgo(post.created_at)}</span>
                )}
              </div>
            </div>
          </div>
          {/* O menu só tem "Apagar post"; sem permissão, não há o que mostrar. */}
          {canDelete && (
          <div className="relative">
            <button
              type="button"
              aria-label="Abrir menu do post"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
              disabled={deleting}
              className="p-2 rounded-sm hover:bg-background transition-all duration-100 ease-out text-foreground cursor-pointer disabled:opacity-60"
            >
              {deleting ? <Loader2 className="animate-spin" /> : <Ellipsis />}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-11 z-20 min-w-40 rounded-control border border-border-base bg-surface-raised p-1 shadow-card">
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
          )}
        </div>
        {detailHref ? (
          <Link href={detailHref} className="block">
            <span className="font-medium whitespace-pre-wrap break-words hover:underline">
              {post.content}
            </span>
          </Link>
        ) : (
          <div>
            <span className="font-medium whitespace-pre-wrap break-words">{post.content}</span>
          </div>
        )}
      </div>
      {postImages.length === 1 && (
        detailHref ? (
          <Link href={detailHref} className="w-full relative max-w-full max-h-96 aspect-video md:rounded-2xl overflow-hidden flex justify-center items-center">
            <Image
              className="object-contain"
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              unoptimized={process.env.NODE_ENV === "development"}
              alt="Imagem da publicação"
              src={postImages[0]}
            />
          </Link>
        ) : (
          <div className="w-full relative max-w-full max-h-96 aspect-video md:rounded-2xl overflow-hidden flex justify-center items-center">
            <Image
              className="object-contain"
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              unoptimized={process.env.NODE_ENV === "development"}
              alt="Imagem da publicação"
              src={postImages[0]}
            />
          </div>
        )
      )}
      {postImages.length > 1 && (
        <div className="grid grid-cols-2 gap-2 px-3">
          {postImages.map((url, index) => (
            detailHref ? (
              <Link
                key={`${post.id}-image-${index}`}
                href={detailHref}
                className="relative h-40 overflow-hidden rounded-lg border border-border-base bg-background"
              >
                <Image
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 320px"
                  unoptimized={process.env.NODE_ENV === "development"}
                  alt={`Imagem ${index + 1} da publicação`}
                  src={url}
                />
              </Link>
            ) : (
              <div
                key={`${post.id}-image-${index}`}
                className="relative h-40 overflow-hidden rounded-lg border border-border-base bg-background"
              >
                <Image
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 320px"
                  unoptimized={process.env.NODE_ENV === "development"}
                  alt={`Imagem ${index + 1} da publicação`}
                  src={url}
                />
              </div>
            )
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2 px-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-6 items-center">
            <button
              type="button"
              onClick={() => void toggleLike()}
              aria-label={`${liked ? "Descurtir" : "Curtir"}, ${likesCount} ${likesCount === 1 ? "curtida" : "curtidas"}`}
              aria-pressed={liked}
              className={clsx(
                "flex gap-2 items-center group cursor-pointer transition-colors duration-150",
                liked
                  ? "text-rose-500 hover:text-rose-600 [&_svg]:fill-rose-500"
                  : "text-foreground dark:hover:text-rose-300 hover:text-rose-600",
              )}
            >
              <Heart aria-hidden="true" />
              <span aria-hidden="true">{likesCount}</span>
            </button>
            {detailHref ? (
              <Link
                href={detailHref}
                aria-label={`Comentar, ${commentsLabel}`}
                className="flex gap-2 items-center hover:text-zinc-600 text-foreground cursor-pointer"
              >
                <MessageSquare aria-hidden="true" />
                <span aria-hidden="true">{loadingInteractions ? "..." : interactions.commentsCount}</span>
              </Link>
            ) : (
              // Já na tela do post: só mostra a contagem.
              <span className="flex gap-2 items-center text-foreground">
                <MessageSquare aria-hidden="true" />
                <span className="sr-only">{commentsLabel}</span>
                <span aria-hidden="true">{loadingInteractions ? "..." : interactions.commentsCount}</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleRepost}
              aria-label={`Repostar, ${loadingInteractions ? "carregando" : `${interactions.repostsCount} reposts`}`}
              aria-pressed={reposted}
              className={clsx(
                "flex gap-2 items-center cursor-pointer",
                reposted
                  ? "text-sky-500 fill-sky-500"
                  : "text-foreground dark:hover:text-sky-200 hover:text-sky-600",
              )}
            >
              <Repeat2 aria-hidden="true" />
              <span aria-hidden="true">{loadingInteractions ? "..." : interactions.repostsCount}</span>
            </button>
          </div>
          <button
            type="button"
            onClick={handleBookmark}
            aria-label={bookmarked ? "Remover dos salvos" : "Salvar post"}
            aria-pressed={bookmarked}
            className="cursor-pointer py-2 px-4 text-foreground rounded-sm hover:bg-background-brand/15 hover:text-foreground-brand transition-all duration-150"
          >
            <Bookmark
              aria-hidden="true"
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
