"use client";

import { Avatar, AvatarProps } from "../Avatar";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { UserIcon } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { useFriends } from "@/lib/hooks/useFriends";

interface NavProps extends AvatarProps {
  size: number;
  alt: string;
  name: string;
  at: string;
  headerUrl?: string | null;
}

type ProfileStats = {
  friendsCount: number;
  communitiesCount: number;
  postsCount: number;
};

export default function LeftNavbar({
  alt,
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
  const { friends, loading: loadingFriends } = useFriends(6);

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

      const { count: postsCount } = await supabase
        .from("posts")
        .select("id", { count: "exact" })
        .eq("user_id", user.id);

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
    <div className="hidden md:flex flex-col gap-6 max-w-80">
      <div className="flex flex-col rounded-card bg-surface shadow-card overflow-hidden h-fit">
        <Link
          href="/perfil"
          className="w-full h-16 relative block"
          aria-label="Abrir perfil"
        >
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
          <div className="overflow-hidden size-16 rounded-full border-4 border-surface flex items-center justify-center mb-3 bg-background-brand absolute -bottom-10 left-4">
            {!src || error ? (
              <UserIcon
                className="text-foreground-inverted"
                size={34}
                weight="fill"
              />
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
            <Link
              href="/perfil"
              className="text-xl text-foreground font-bold hover:underline w-fit"
            >
              {name}
            </Link>
            <Link
              href="/perfil"
              className="text-subtitle hover:underline w-fit"
            >
              @{at}
            </Link>
          </div>
          {/* Números do perfil: termo + valor (dl), não títulos. */}
          <dl className="border-t border-border-base flex justify-between p-2 gap-2">
            {[
              { label: "Amigos", value: stats.friendsCount },
              { label: "Comunidades", value: stats.communitiesCount },
              { label: "Publicações", value: stats.postsCount },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col-reverse items-center justify-center">
                <dt className="text-sm text-subtitle font-medium">{label}</dt>
                <dd className="text-lg font-bold">{loadingStats ? "..." : value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="flex flex-col rounded-card bg-surface shadow-card overflow-hidden h-fit px-6 py-4 gap-2">
        <div className="flex justify-between">
          <h2 className=" flex items-center uppercase font-bold tracking-wide text-sm text-foreground ">
            Seus amigos
          </h2>
          <span className="flex items-center text-foreground-brand font-medium text-sm px-2 py-1">
            {loadingStats ? "..." : stats.friendsCount}
          </span>
        </div>
        <div className="flex flex-wrap gap-4">
          {loadingFriends ? (
            <p className="text-xs text-subtitle">Carregando...</p>
          ) : friends.length === 0 ? (
            <p className="text-xs text-subtitle">Nenhum amigo ainda</p>
          ) : (
            friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/perfil/${friend.username}`}
                className="flex flex-col justify-center items-center gap-2 text-xs text-subtitle truncate max-w-16 hover:opacity-80 transition-opacity"
              >
                <div className="flex flex-col rounded-full size-16 items-center justify-center">
                  <Avatar src={friend.avatar_url} />
                </div>
                <span title={friend.name} className="w-full min-w-0 truncate">
                  {friend.name}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
