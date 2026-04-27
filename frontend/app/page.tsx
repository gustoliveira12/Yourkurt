"use client";
import PageAside from "@/components/NavBar";
import LeftNavbar from "@/components/LeftNav";
import Post from "@/components/Post";
import PostCard from "@/components/PostCard";
import RightNavbar from "@/components/RightNav";
import Story from "@/components/Stories";
import {
  HouseIcon,
  UsersIcon,
  UserIcon,
  UsersFourIcon,
  ChatIcon,
  GearSixIcon,
  PlusIcon,
  GameControllerIcon,
  MusicNotesIcon,
  BookIcon,
  AirplaneIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

const NAV_ITEMS = [
  {
    label: "Feed",
    to: "/",
    icon: HouseIcon,
  },
  {
    label: "Perfil",
    to: "/perfil",
    icon: UserIcon,
  },
  {
    label: "Amigos",
    to: "/friends",
    icon: UsersIcon,
  },
  {
    label: "Comunidade",
    to: "/communities",
    icon: UsersFourIcon,
  },
  {
    label: "Mensagens",
    to: "/messages",
    icon: ChatIcon,
  },
  {
    label: "Configurações",
    to: "/settings",
    icon: GearSixIcon,
  },
];

export default function Home() {
  const NavLinks = [
    {
      text: "Feed",
      redirect: "/",
      icon: HouseIcon,
    },
    {
      text: "Perfil",
      redirect: "/",
      icon: UserIcon,
    },
    {
      text: "Amigos",
      redirect: "/",
      icon: UsersIcon,
    },
    {
      text: "Comunidade",
      redirect: "/",
      icon: UsersFourIcon,
    },
    {
      text: "Mensagens",
      redirect: "/",
      icon: ChatIcon,
    },
    {
      text: "Configurações",
      redirect: "/",
      icon: GearSixIcon,
    },
  ];
  const Comunnities = [
    {
      text: "GamersBr",
      redirect: "/",
      icon: GameControllerIcon,
      color: "rose",
    },
    {
      text: "Indie Music",
      redirect: "/",
      icon: MusicNotesIcon,
      color: "emerald",
    },
    {
      text: "Clube do livro",
      redirect: "/",
      icon: BookIcon,
      color: "sky",
    },
    {
      text: "Mochileiros",
      redirect: "/",
      icon: AirplaneIcon,
      color: "amber",
    },
  ];
  return (
    <div className="w-dvw min-h-dvh overflow-hidden relative flex h-screen items-center justify-center bg-background font-sans gap-4">
      <PageAside items={NAV_ITEMS} />
      <main className="overflow-auto h-dvh flex-1 w-full flex items-start justify-center pt-12 gap-4 ">
        <LeftNavbar
          prop={NavLinks}
          avatar={{
            src: "https://i.pinimg.com/736x/bf/86/16/bf86169cb425cf8c1dc82d8ffb5c1fb5.jpg",
            alt: "lindao",
            size: 1,
          }}
        />
        <div className="flex flex-col gap-12 items-center min-w-xl px-4 ">
          <div className="flex flex-col w-full ">
            <div className="flex gap-4 justify-start items-center ">
              <div className="flex flex-col justify-center items-center gap-1.5 ">
                <div className="size-12 rounded-full outline-2 outline-offset-2 outline-purple-500/25 bg-purple-500/15 flex flex-col items-center justify-center text-purple-400  ">
                  <PlusIcon />
                </div>
                <span className="text-xs text-zinc-400 truncate">
                  Seu story
                </span>
              </div>
              {/* TODO:AUMENTAR TAMANHO E TROCAR COR DO STORY */}
              <Story
                src="https://imgs.search.brave.com/CvAgmXxTi94acxEz7Et418I4Q90sN60BmSz3OsuCnLE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZW5zLm5lMTAudW9s/LmNvbS5ici92ZWlj/dWxvcy9fbWlkaWFz/L2pwZy8yMDI1LzEy/LzEwL2dheV93aGlu/ZGVyc3Nvbl9udW5l/c192b2x0YV9hX2Zh/bGFyX3NvYnJlX3N1/YV9zZXh1YWxpZGFk/ZS0zNjE2NTE3Ni5q/cGc_aW1zPTMwNXgx/NzM"
                size={32}
                alt=""
              />
            </div>
          </div>
          <div className="flex flex-col w-full gap-8">
            <PostCard Mensagem="Acabei de voltar de Floripa, o pôr do sol na lagoinha tava do caralho" />
            <PostCard Mensagem="Acabei de voltar de Floripa, o pôr do sol na lagoinha tava do caralho" />
            <PostCard Mensagem="Acabei de voltar de Floripa, o pôr do sol na lagoinha tava do caralho" />
          </div>
        </div>
        <RightNavbar prop={Comunnities} />
      </main>
    </div>
  );
}
