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
  const [stats, setStats] = useState<ProfileStats | null>(null);
  // Amigos = quem você segue e segue você de volta (get_my_follow_lists).
  const { friends, total: friendsCount, loading: loadingFriends } = useFriends(6);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      const supabase = createClient();
      // getSession lê a sessão salva no navegador; o RLS protege as consultas.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (!userId) return;

      // head: true pede só a contagem, sem baixar as linhas.
      const [posts, communities] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase
          .from("community_memberships")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);
      if (!active) return;

      setStats({
        postsCount: posts.count ?? 0,
        communitiesCount: communities.count ?? 0,
      });
    }

    void loadStats();
    return () => {
      active = false;
    };
  }, []);

  const loadingStats = !stats;

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
              { label: "Amigos", value: friendsCount, loading: loadingFriends },
              { label: "Comunidades", value: stats?.communitiesCount, loading: loadingStats },
              { label: "Publicações", value: stats?.postsCount, loading: loadingStats },
            ].map(({ label, value, loading }) => (
              <div key={label} className="flex flex-col-reverse items-center justify-center">
                <dt className="text-sm text-subtitle font-medium">{label}</dt>
                <dd className="text-lg font-bold">{loading ? "..." : value}</dd>
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
          <Link
            href="/friends"
            className="flex items-center text-foreground-brand font-medium text-sm px-2 py-1 rounded-sm hover:underline"
          >
            {loadingFriends ? "Ver todos" : `Ver todos (${friendsCount})`}
          </Link>
        </div>
        <div className="flex flex-wrap gap-4">
          {loadingFriends ? (
            <p className="text-xs text-subtitle">Carregando...</p>
          ) : friends.length === 0 ? (
            <p className="text-xs text-subtitle">
              Nenhum amigo ainda. Amigos são as pessoas que você segue e que seguem você de volta.
            </p>
          ) : (
            friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/perfil/${encodeURIComponent(friend.username)}`}
                className="flex flex-col justify-center items-center gap-2 text-xs text-subtitle truncate max-w-16 hover:opacity-80 transition-opacity"
              >
                <div className="flex flex-col rounded-full size-16 items-center justify-center">
                  <Avatar src={friend.avatar_url} name={friend.name} decorative />
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
