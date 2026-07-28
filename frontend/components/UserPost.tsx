"use client";

import {
  Bookmark,
  Ellipsis,
  Heart,
  MessageSquare,
  Repeat2,
} from "lucide-react";
import { Avatar } from "./Avatar";
import Image from "next/image";
import clsx from "clsx";
import { useState } from "react";
import { useLikes } from "@/lib/hooks/useLikes";
import type { Post } from "@/lib/hooks/usePosts";

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Agora mesmo";
  if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Há ${Math.floor(diff / 3600)} h`;
  return `Há ${Math.floor(diff / 86400)} dias`;
}

export default function PostCard({ post }: { post: Post }) {
  const [reposted, setReposted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const { liked, likesCount, toggleLike } = useLikes(post.id, post.likes_count);

  const author = post.profiles;

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
          <div className="p-2 rounded-sm hover:bg-background transition-all duration-100 ease-out text-foreground cursor-pointer">
            <Ellipsis />
          </div>
        </div>
        <div>
          <span className="font-medium whitespace-pre-wrap">{post.content}</span>
        </div>
      </div>
      {post.image_url && (
        <div className="w-full relative max-w-full max-h-96 aspect-video md:rounded-xl overflow-hidden flex justify-center items-center">
          <Image
            className="object-contain"
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            alt="Imagem da publicação"
            src={post.image_url}
          />
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
              <span>0</span>
            </button>
            <button
              onClick={() => setReposted(!reposted)}
              className={clsx(
                "flex gap-2 items-center cursor-pointer",
                reposted
                  ? "text-sky-500 fill-sky-500"
                  : "text-foreground dark:hover:text-sky-200 hover:text-sky-600",
              )}
            >
              <Repeat2 />
              <span>0</span>
            </button>
          </div>
          <button
            onClick={() => setBookmarked(!bookmarked)}
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
