"use client";

import type { UrlObject } from "url";
import { Avatar, AvatarProps } from "../Avatar";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { type Icon, ArrowRightIcon, UserIcon } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

export interface NavlinksItem {
  text: string;
  redirect: UrlObject | string;
  icon: Icon;
  label?: string;
  to?: string;
}

interface NavProps extends AvatarProps {
  prop: NavlinksItem[];
  size: number;
  alt: string;
  name: string;
  at: string;
  headerUrl?: string | null;
}

type NavlinkProps = {
  prop: NavlinksItem[];
  avatar: AvatarProps;
  size: number;
  alt: string;
};

type ProfileStats = {
  friendsCount: number;
  communitiesCount: number;
  postsCount: number;
};

export default function LeftNavbar({
  prop,
  size,
  alt,
  sizes,
  src,
  name,
  at,
  headerUrl,
}: NavProps) {
  const [error, setError] = useState(false);
  const [stats, setStats] = useState<ProfileStats>({
    friendsCount: 0,
    communitiesCount: 0,
    postsCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch user statistics
  useEffect(() => {
    async function loadStats() {
      setLoadingStats(true);
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoadingStats(false);
        return;
      }

      // Count user's posts
      const { count: postsCount } = await supabase
        .from("posts")
        .select("id", { count: "exact" })
        .eq("user_id", user.id);

      // Count user's friends (both directions in friendships table)
      const { count: friendsCount } = await supabase
        .from("friendships")
        .select("id", { count: "exact" })
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      setStats({
        postsCount: postsCount ?? 0,
        friendsCount: friendsCount ?? 0,
        communitiesCount: 0, // TODO: implement communities feature
      });
      setLoadingStats(false);
    }

    void loadStats();
  }, []);

  return (
    <div className="hidden md:flex flex-col gap-8 max-w-80">
      <div className="flex flex-col rounded-xl bg-background-raised overflow-hidden h-fit ">
        <Link href="/perfil" className="w-full h-16 relative block" aria-label="Abrir perfil">
          {headerUrl ? (
            <Image
              fill
              sizes="320px"
              quality={90}
              alt={`Capa de ${name}`}
              src={headerUrl}
              className="object-cover"
            />
          ) : (
            <div className="gradient-to-l absolute inset-0" />
          )}
          <div className="overflow-hidden size-16 rounded-full border-4 border-background-raised flex items-center justify-center mb-3 bg-purple-500 absolute -bottom-10 left-4">
            {!src || error ? (
              <UserIcon className="text-foreground-inverted" size={34} weight="fill" />
            ) : (
              <Image
                className=""
                fill
                sizes="64px"
                quality={90}
                alt={alt!}
                src={src!}
                onError={() => setError(true)}
              />
            )}
          </div>
        </Link>
        <div className="flex flex-col px-6 py-4 gap-4 relative pt-10">
          <div className="flex flex-col w-full">
            <div className="flex w-full justify-between">
              <Link href="/perfil" className="text-xl text-foreground font-bold hover:underline">
                {name}
              </Link>
              <button className="text-sm text-foreground-brand cursor-pointer">
                trocar
              </button>
            </div>
            <Link href="/perfil" className="text-subtitle hover:underline w-fit">
              @{at}
            </Link>
          </div>
          <div className="border-t border-zinc-800 flex justify-between p-2 gap-2">
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-bold">
                {loadingStats ? "..." : stats.friendsCount}
              </h3>
              <span className="text-sm text-subtitle font-medium ">Amigos</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-bold">
                {loadingStats ? "..." : stats.communitiesCount}
              </h3>
              <span className="text-sm text-subtitle font-medium ">
                Comunidades
              </span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-bold">
                {loadingStats ? "..." : stats.postsCount}
              </h3>
              <span className="text-sm text-subtitle font-medium ">
                Publicações
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col rounded-xl bg-background-raised overflow-hidden h-fit  px-6 py-4 gap-2">
        <div className="flex justify-between">
          <h2 className=" flex items-center uppercase font-bold tracking-wide text-sm text-foreground ">
            Seus amigos
          </h2>
          <button className="flex items-center justify-center  text-foreground-brand font-medium text-sm hover:bg-foreground-brand/15 px-2 py-1 rounded-sm transition-all duration-150 gap-1 cursor-pointer ">
            300
            <ArrowRightIcon size={12} />
          </button>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col justify-center items-center gap-2 text-xs text-zinc-400 truncate max-w-16 ">
            <div className="flex flex-col rounded-full size-16  items-center justify-center ">
              <Avatar src="" />
            </div>
            <span
              title=" HingleMcGringleBerry"
              className="w-full min-w-0 truncate"
            >
              HingleMcGringleBerry
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
