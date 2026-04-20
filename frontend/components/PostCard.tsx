"use client";

import {
  Bookmark,
  Ellipsis,
  Heart,
  MessageSquare,
  Repeat2,
  Smile,
} from "lucide-react";
import Avatar from "./Avatar";
import Image from "next/image";
import clsx from "clsx";
import { useState } from "react";

export default function PostCard() {
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const Mensagem = "";
  const src =
    "https://imgs.search.brave.com/CvAgmXxTi94acxEz7Et418I4Q90sN60BmSz3OsuCnLE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZW5zLm5lMTAudW9s/LmNvbS5ici92ZWlj/dWxvcy9fbWlkaWFz/L2pwZy8yMDI1LzEy/LzEwL2dheV93aGlu/ZGVyc3Nvbl9udW5l/c192b2x0YV9hX2Zh/bGFyX3NvYnJlX3N1/YV9zZXh1YWxpZGFk/ZS0zNjE2NTE3Ni5q/cGc_aW1zPTMwNXgx/NzM";
  const tags = ["Viagem", "Floripa", "Praia"];
  return (
    <div className="flex flex-col px-6 py-4 w-full  bg-zinc-950 rounded-lg gap-2  border border-zinc-800 ">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center  ">
          <div className="flex gap-4">
            <div>
              <Avatar size={32} alt="" src="" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold">Pedro Alves</h3>
              <div className="flex gap-4 text-zinc-400 ">
                <span> Há 12 minutos </span>
                <span className="flex justify-center gap-2 items-center text-amber-400 ">
                  Feliz <Smile size={18} />{" "}
                </span>
              </div>
            </div>
          </div>
          <div className="p-2 rounded-sm hover:bg-zinc-400/10 transition-all duration-100 ease-out ">
            <Ellipsis />
          </div>
        </div>
        <div>{Mensagem && <span className="font-medium">{Mensagem}</span>}</div>
      </div>
      <div className="w-full relative max-w-full max-h-96 aspect-video rounded-xl overflow-hidden flex justify-center items-center ">
        {src && (
          <Image className="object-contain" fill alt="foda-se" src={src} />
        )}{" "}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 max-w-full flex-wrap">
          {tags.map((hashtag) => (
            <div
              className="px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500 text-purple-500 w-fit font-semibold tracking-wide text-sm"
              key={hashtag}
            >
              #{hashtag}
            </div>
          ))}
        </div>
        <div className="h-0.5 w-full bg-zinc-800"></div>
        <div className="flex justify-between items-center">
          <div className="flex gap-6 items-center">
            <button
              onClick={() => setLiked(!liked)}
              className={clsx(
                "flex gap-2 items-center group",
                liked
                  ? "text-rose-500 hover:text-rose-600 fill-rose-500 "
                  : "text-zinc-200 hover:text-rose-300",
              )}
            >
              <Heart
                className={clsx(
                  "flex gap-2 items-center group-hover:text-rose-300 ",
                  liked ? "text-rose-500 fill-rose-500 " : "text-zinc-200",
                )}
              />
              <span>50</span>
            </button>
            <button
              className={clsx(
                "flex gap-2 items-center hover:text-zinc-600 text-zinc-200 ",
              )}
            >
              <MessageSquare className={clsx("flex gap-2 items-center")} />
              <span>50</span>
            </button>
            <button
              onClick={() => setReposted(!reposted)}
              className={clsx(
                "flex gap-2 items-center ",
                reposted
                  ? "text-sky-500 fill-sky-500"
                  : "text-zinc-200 hover:text-sky-200",
              )}
            >
              <Repeat2 className={clsx("flex gap-2 items-center")} />
              <span>50</span>
            </button>
          </div>
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className="py-2 px-4 text-zinc-400 rounded-sm hover:bg-purple-500/15 hover:text-purple-500 transition-all duration-150"
          >
            <Bookmark className={clsx(bookmarked ? "fill-purple-500" : "")} />
          </button>
        </div>
      </div>
    </div>
  );
}
