"use client";

import { Camera, Music, Pin, Send, SmilePlus } from "lucide-react";
import { Avatar } from "./Avatar";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Post } from "@/lib/hooks/usePosts";

type CreatePostboxProps = {
  avatarUrl: string | null;
  userId: string;
  profile: { name: string; username: string; avatar_url: string | null } | null;
  onPostCreated: (post: Post) => void;
};

export default function CreatePostbox({
  avatarUrl,
  userId,
  profile,
  onPostCreated,
}: CreatePostboxProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("posts")
      .insert({ user_id: userId, content: trimmed, is_public: true })
      .select("id, user_id, content, image_url, created_at, likes_count")
      .single();

    if (!error && data) {
      onPostCreated({
        ...data,
        profiles: profile,
      } as Post);
      setContent("");
    }
    setSubmitting(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      void handleSubmit();
    }
  }

  return (
    <div className=" flex-col w-full px-6 py-4 rounded-lg bg-background-raised gap-4 max-w-lg hidden sm:flex">
      <div className="flex gap-4">
        <div className="rounded-full flex items-start justify-center w-fit h-fit mt-1">
          <Avatar src={avatarUrl} />
        </div>
        <textarea
          placeholder="O que está passando pela sua órbita?"
          className="bg-background w-full rouded-xl transition-all duration-100 border border-border-base rounded-sm px-4 py-2 placeholder:text-foreground-muted text-foreground resize-none min-h-[80px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={500}
        />
      </div>
      <div className="flex gap-4 h-10">
        <div className="flex gap-2">
          <button className="justify-center aspect-square md:aspect-auto text-sm font-medium flex border border-border-base text-foreground rounded-sm px-2 h-full gap-2 items-center hover:bg-purple-200 hover:border-purple-600  dark:hover:border-purple-400 dark:hover:bg-purple-500/10 transition-all duration-150 ease-out">
            <Camera
              size={18}
              className="dark:text-purple-400 text-purple-600"
            />
            <span className="hidden md:flex">Foto</span>
          </button>
          <button className="justify-center aspect-square md:aspect-auto text-sm font-medium flex border border-border-base text-foreground rounded-sm px-2 h-full gap-2 items-center hover:bg-emerald-100 hover:border-emerald-600 dark:hover:border-emerald-400 dark:hover:bg-emerald-500/10 transition-all duration-150 ease-out">
            <Music
              className="dark:text-emerald-500 text-emerald-600"
              size={16}
            />
            <span className="hidden md:flex">Musica</span>
          </button>
          <button className="justify-center aspect-square md:aspect-auto text-sm font-medium flex border border-border-base text-foreground rounded-sm px-2 h-full gap-2 items-center hover:border-red-500 hover:bg-red-200 dark:hover:border-red-400 dark:hover:bg-red-500/10 transition-all duration-150 ease-out">
            <Pin className="dark:text-red-400 text-red-600" size={16} />
            <span className="hidden md:flex">Local</span>
          </button>
          <button className="justify-center aspect-square md:aspect-auto text-sm font-medium flex border border-border-base text-foreground rounded-sm px-2 h-full gap-2 items-center hover:border-yellow-700 dark:hover:border-yellow-500 hover:bg-yellow-200 dark:hover:bg-yellow-500/10 transition-all duration-150 ease-out">
            <SmilePlus
              strokeWidth={3}
              className="text-yellow-600 dark:text-yellow-400"
              size={16}
            />
            <span className="hidden md:flex">Humor</span>
          </button>
        </div>
        <button
          onClick={() => void handleSubmit()}
          disabled={!content.trim() || submitting}
          className="aspect-square md:aspect-auto brightness-90 flex justify-center items-center h-full w-12 gradient-to-l rounded-sm font-bold text-foreground hover:brightness-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity duration-150"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
