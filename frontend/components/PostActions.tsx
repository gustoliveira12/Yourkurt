"use client";

import { Bookmark, Heart, MessageSquare, Repeat2 } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { useState } from "react";
import { useLikes } from "@/lib/hooks/useLikes";
import { useInteractions } from "@/lib/hooks/useInteractions";

type PostActionsProps = {
  postId: string;
  initialLikes: number;
  /** No feed: o balão de comentário leva à página do post. */
  commentHref?: string;
  /** Na página do post: o balão de comentário leva à caixa de resposta. */
  onComment?: () => void;
  /** Contagem de comentários já conhecida pela tela (substitui a consulta). */
  commentsCount?: number;
  className?: string;
};

// Curtir, comentar, repostar e salvar. Usado nos cards do feed e na página do
// post, para os dois terem os mesmos botões. Repost e salvar ainda ficam só no
// navegador (localStorage), como antes.
export default function PostActions({
  postId,
  initialLikes,
  commentHref,
  onComment,
  commentsCount,
  className,
}: PostActionsProps) {
  const [reposted, setReposted] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`reposted-${postId}`) === "true";
  });
  const [bookmarked, setBookmarked] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`bookmarked-${postId}`) === "true";
  });
  const { liked, likesCount, toggleLike } = useLikes(postId, initialLikes);
  const { interactions, loading: loadingInteractions } = useInteractions(postId);

  const comments = commentsCount ?? interactions.commentsCount;
  const commentsLoading = commentsCount === undefined && loadingInteractions;
  const commentsLabel = commentsLoading
    ? "carregando comentários"
    : `${comments} ${comments === 1 ? "comentário" : "comentários"}`;
  const commentsText = commentsLoading ? "..." : comments;
  const commentClass = "flex gap-2 items-center text-foreground hover:text-zinc-600 cursor-pointer";

  function handleRepost() {
    const next = !reposted;
    setReposted(next);
    localStorage.setItem(`reposted-${postId}`, next.toString());
  }

  function handleBookmark() {
    const next = !bookmarked;
    setBookmarked(next);
    localStorage.setItem(`bookmarked-${postId}`, next.toString());
  }

  return (
    <div className={clsx("flex justify-between items-center", className)}>
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

        {commentHref ? (
          <Link href={commentHref} aria-label={`Comentar, ${commentsLabel}`} className={commentClass}>
            <MessageSquare aria-hidden="true" />
            <span aria-hidden="true">{commentsText}</span>
          </Link>
        ) : onComment ? (
          <button
            type="button"
            onClick={onComment}
            aria-label={`Comentar, ${commentsLabel}`}
            className={commentClass}
          >
            <MessageSquare aria-hidden="true" />
            <span aria-hidden="true">{commentsText}</span>
          </button>
        ) : (
          <span className="flex gap-2 items-center text-foreground">
            <MessageSquare aria-hidden="true" />
            <span className="sr-only">{commentsLabel}</span>
            <span aria-hidden="true">{commentsText}</span>
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
          className={clsx(bookmarked && "fill-background-brand text-foreground-brand")}
        />
      </button>
    </div>
  );
}
