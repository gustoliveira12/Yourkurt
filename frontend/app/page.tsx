"use client";
import HeaderBar from "@/components/Header";
import LeftNavbar from "@/components/LeftNav";
import Post from "@/components/Post";
import RightNavbar from "@/components/RightNav";
import Story from "@/components/Stories";
import {
  House,
  User,
  Group,
  MessageCircle,
  Settings,
  Handshake,
  Plus,
  Gamepad2,
  Music,
  Book,
  Plane,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const NavLinks = [
    {
      text: "Feed",
      redirect: "/",
      icon: House,
    },
    {
      text: "Perfil",
      redirect: "/",
      icon: User,
    },
    {
      text: "Amigos",
      redirect: "/",
      icon: Group,
    },
    {
      text: "Comunidade",
      redirect: "/",
      icon: Handshake,
    },
    {
      text: "Mensagens",
      redirect: "/",
      icon: MessageCircle,
    },
    {
      text: "Configurações",
      redirect: "/",
      icon: Settings,
    },
  ];
  const Comunnities = [
    {
      text: "GamersBr",
      redirect: "/",
      icon: Gamepad2,
      color: "rose",
    },
    {
      text: "Indie Music",
      redirect: "/",
      icon: Music,
      color: "emerald",
    },
    {
      text: "Clube do livro",
      redirect: "/",
      icon: Book,
      color: "sky",
    },
    {
      text: "Mochileiros",
      redirect: "/",
      icon: Plane,
      color: "amber",
    },
  ];
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black gap-4">
      <HeaderBar />
      <main className="h-dvh w-full flex items-start  justify-center  ">
        <LeftNavbar prop={NavLinks} />
        <div className="flex flex-col gap-12 items-center min-w-3xl px-4 ">
          <div className="flex flex-col w-full ">
            <div className="flex flex-col items-start justify-start py-4  ">
              <h1 className="text-xl text-zinc-100 font-black ">
                Olá, Luciano!
              </h1>
              <span className="text-lg text-zinc-400 font-medium">
                Veja oque está rolando no seu universo
              </span>
            </div>
            <div className="flex gap-4 justify-start items-center ">
              <div className="flex flex-col justify-center items-center gap-1.5 ">
                <div className="size-12 rounded-full outline-2 outline-offset-2 outline-purple-500/25 bg-purple-500/15 flex flex-col items-center justify-center text-purple-400  ">
                  <Plus />
                </div>
                <span className="text-xs text-zinc-400 truncate">
                  Seu story
                </span>
              </div>
              <Story
                src="https://imgs.search.brave.com/CvAgmXxTi94acxEz7Et418I4Q90sN60BmSz3OsuCnLE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZW5zLm5lMTAudW9s/LmNvbS5ici92ZWlj/dWxvcy9fbWlkaWFz/L2pwZy8yMDI1LzEy/LzEwL2dheV93aGlu/ZGVyc3Nvbl9udW5l/c192b2x0YV9hX2Zh/bGFyX3NvYnJlX3N1/YV9zZXh1YWxpZGFk/ZS0zNjE2NTE3Ni5q/cGc_aW1zPTMwNXgx/NzM"
                size={32}
                alt=""
              />
            </div>
          </div>
          <div className="flex flex-col w-full  ">
            <Post
              alt="Pfp img"
              size={24}
              src="https://imgs.search.brave.com/CvAgmXxTi94acxEz7Et418I4Q90sN60BmSz3OsuCnLE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZW5zLm5lMTAudW9s/LmNvbS5ici92ZWlj/dWxvcy9fbWlkaWFz/L2pwZy8yMDI1LzEy/LzEwL2dheV93aGlu/ZGVyc3Nvbl9udW5l/c192b2x0YV9hX2Zh/bGFyX3NvYnJlX3N1/YV9zZXh1YWxpZGFk/ZS0zNjE2NTE3Ni5q/cGc_aW1zPTMwNXgx/NzM"
            />
          </div>
        </div>
        <RightNavbar prop={Comunnities} />
      </main>
    </div>
  );
}
