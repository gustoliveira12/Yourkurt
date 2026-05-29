"use client";

import {
  Bookmark,
  Ellipsis,
  Heart,
  MessageSquare,
  Repeat2,
  Smile,
} from "lucide-react";
import { Avatar } from "./Avatar";
import Image from "next/image";
import clsx from "clsx";
import { useState } from "react";

type PostcardProp = { Mensagem: string };

export default function PostCard({ Mensagem }: PostcardProp) {
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const src =
    "https://i.pinimg.com/1200x/2a/63/1d/2a631d3d6664c0c84bf78db4a758a2a9.jpg";
  const tags = ["Viagem", "Floripa", "Praia"];
  return (
    <div className="flex flex-col md:py-4 md:w-full md:rounded-lg gap-2 w-dvw">
      <div className="flex flex-col gap-4 px-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 ">
            <div>
              <Avatar src="" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-foreground cursor-pointer">
                Pedro Alves
              </h3>
              <div className="flex gap-4 text-subtitle">
                <span> Há 12 minutos </span>
                <span className="font-medium flex justify-center gap-2 items-center dark:text-yellow-400 text-yellow-600 ">
                  Feliz <Smile strokeWidth={3} size={18} />{" "}
                </span>
              </div>
            </div>
          </div>
          <div className="p-2 rounded-sm hover:bg-background transition-all duration-100 ease-out text-foreground cursor-pointer">
            <Ellipsis />
          </div>
        </div>
        <div>{Mensagem && <span className="font-medium">{Mensagem}</span>}</div>
      </div>
      <div className="w-full relative max-w-full max-h-96 aspect-video md:rounded-xl overflow-hidden flex justify-center items-center ">
        {src && (
          <Image className="object-contain" fill alt="foda-se" src={src} />
        )}{" "}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 max-w-full flex-wrap">
          {tags.map((hashtag) => (
            <div
              className="px-1 rounded-sm bg-tag-brand text-foreground-inverted w-fit font-bold tracking-wide text-xs uppercase cursor-pointer hover:bg-[var(--brand-500)]"
              key={hashtag}
            >
              {hashtag}
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <div className="flex gap-6 items-center">
            {/* TODO: ADD ANIMATIONS */}
            <button
              onClick={() => setLiked(!liked)}
              className={clsx(
                "flex gap-2 items-center group cursor-pointer",
                liked
                  ? "text-rose-500 hover:text-rose-600 fill-rose-500 [&_svg]:fill-rose-500"
                  : "text-foreground dark:hover:text-rose-300 hover:text-rose-600",
              )}
            >
              <Heart />
              <span>50</span>
            </button>
            <button
              className={clsx(
                "flex gap-2 items-center hover:text-zinc-600 text-foreground cursor-pointer",
              )}
            >
              <MessageSquare className={clsx("flex gap-2 items-center")} />
              <span>50</span>
            </button>
            <button
              onClick={() => setReposted(!reposted)}
              className={clsx(
                "flex gap-2 items-center cursor-pointer",
                reposted
                  ? "text-sky-500 fill-sky-500"
                  : "text-foreground dark:hover:text-sky-200 hover:text-sky-600  ",
              )}
            >
              <Repeat2 className={clsx("flex gap-2 items-center")} />
              <span>50</span>
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
