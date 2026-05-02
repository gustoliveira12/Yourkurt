"use client";
import { user } from "@/lib/user";
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
          alt="string"
          size={1}
          prop={NavLinks}
          name="Lucas Silva"
          at="lucas.silva"
          src={user.img}
        />
        <div className="flex flex-col gap-12 items-center min-w-152 px-4">
          <div className="flex flex-col w-full ">
            <div className="flex gap-6 justify-start items-center max-w-xl overflow-hidden px-2">
              {/* TODO: TROCAR O OUTLINE DOS STORIES, PORQUE ESTA HARDCODED */}
              <Story hasStory name={user.name} src={user.img} />
              <Story hasStory name="Renata" src="/imagem_foda.webp" />
              <Story
                hasStory
                name="Whindersson Nunes"
                src="https://i.pinimg.com/736x/1e/ef/f8/1eeff8134eac63b5f367d464b2da70e9.jpg"
              />
              <Story
                hasStory
                name="Whindersson Nunes"
                src="https://i.pinimg.com/736x/1e/ef/f8/1eeff8134eac63b5f367d464b2da70e9.jpg"
              />
              <Story
                hasStory
                name="Whindersson Nunes"
                src="https://i.pinimg.com/736x/1e/ef/f8/1eeff8134eac63b5f367d464b2da70e9.jpg"
              />
              <Story
                hasStory
                name="Whindersson Nunes"
                src="https://i.pinimg.com/736x/1e/ef/f8/1eeff8134eac63b5f367d464b2da70e9.jpg"
              />
              <Story
                hasStory
                name="Whindersson Nunes"
                src="https://i.pinimg.com/736x/1e/ef/f8/1eeff8134eac63b5f367d464b2da70e9.jpg"
              />
              <Story
                hasStory
                name="Whindersson Nunes"
                src="https://i.pinimg.com/736x/1e/ef/f8/1eeff8134eac63b5f367d464b2da70e9.jpg"
              />
              <Story
                hasStory
                name="Whindersson Nunes"
                src="https://i.pinimg.com/736x/1e/ef/f8/1eeff8134eac63b5f367d464b2da70e9.jpg"
              />
              <Story
                hasStory
                name="Whindersson Nunes"
                src="https://i.pinimg.com/736x/1e/ef/f8/1eeff8134eac63b5f367d464b2da70e9.jpg"
              />
              <Story
                hasStory
                name="Whindersson Nunes"
                src="https://i.pinimg.com/736x/1e/ef/f8/1eeff8134eac63b5f367d464b2da70e9.jpg"
              />
            </div>
          </div>
          <div className="flex flex-col w-full gap-8 max-w-lg">
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
