"use client";

import { Avatar } from "@/components/Avatar";
import MobileHeader from "@/components/navigation/MobileHeader";
import MobileNav from "@/components/navigation/MobileNav";
import PageAside from "@/components/navigation/NavBar";
import ProfileSidebar from "@/components/navigation/ProfileSidebar";
import PostCard from "@/components/UserPost";
import { usePosts } from "@/lib/hooks/usePosts";
import { createClient } from "@/lib/supabase/client";
import {
  CalendarDotsIcon,
  GearSixIcon,
  GlobeHemisphereWestIcon,
  HouseIcon,
  MapPinIcon,
  UserIcon,
  UsersFourIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type PublicProfile = {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  birthday: string | null;
  avatar_url: string | null;
  header_url: string | null;
  followers_count: number;
  following_count: number;
  i_follow: boolean;
  follows_me: boolean;
};

const supabase = createClient();

const NAV_ITEMS = [
  { label: "Feed", to: "/", icon: HouseIcon },
  { label: "Perfil", to: "/perfil", icon: UserIcon },
  { label: "Amigos", to: "/friends", icon: UsersIcon },
  { label: "Comunidade", to: "/communities", icon: UsersFourIcon },
  { label: "Configurações", to: "/settings", icon: GearSixIcon },
];

const PROFILE_LINKS = [
  { text: "Feed", redirect: "/", icon: HouseIcon },
  { text: "Perfil", redirect: "/perfil", icon: UserIcon },
  { text: "Amigos", redirect: "/friends", icon: UsersIcon },
  { text: "Comunidade", redirect: "/communities", icon: UsersFourIcon },
  { text: "Configurações", redirect: "/settings", icon: GearSixIcon },
];

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [viewer, setViewer] = useState({
    name: "",
    username: "",
    avatarUrl: "",
    headerUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { posts, loading: postsLoading, error: postsError } = usePosts(profile?.id ?? null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      const targetUsername = decodeURIComponent(username);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const [{ data: me }, { data, error: rpcError }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, name, username, avatar_url, header_url")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.rpc("get_public_profile", { p_username: targetUsername }),
      ]);

      if (me?.username?.toLowerCase() === targetUsername.toLowerCase()) {
        router.replace("/perfil");
        return;
      }

      setViewer({
        name: me?.name ?? "",
        username: me?.username ?? "",
        avatarUrl: me?.avatar_url ?? "",
        headerUrl: me?.header_url ?? "",
      });

      if (rpcError) {
        setError("Não foi possível carregar este perfil.");
      } else {
        setProfile((data?.[0] as PublicProfile | undefined) ?? null);
      }
      setLoading(false);
    }

    void load();
  }, [username, router]);

  return (
    <div className="w-dvw min-h-dvh overflow-hidden relative flex h-screen items-center justify-center bg-background font-sans gap-4">
      <PageAside items={NAV_ITEMS} />
      <MobileHeader />

      <main className="overflow-auto h-dvh flex-1 w-full flex items-start justify-center pt-20 gap-4 sm:pt-12">
        <ProfileSidebar
          alt="Foto de perfil"
          size={1}
          prop={PROFILE_LINKS}
          name={viewer.name || "Carregando..."}
          at={viewer.username || "usuario"}
          src={viewer.avatarUrl || null}
          headerUrl={viewer.headerUrl || null}
        />

        <section className="w-full max-w-4xl px-3 md:px-4 pb-24 sm:pb-10">
          {loading ? (
            <p className="py-8 text-center text-subtitle">Carregando perfil...</p>
          ) : error || !profile ? (
            <p className="py-8 text-center text-subtitle">
              {error || "Usuário não encontrado."}
            </p>
          ) : (
            <div className="rounded-card overflow-hidden border border-border-base bg-surface shadow-card">
              <div className="relative h-38 md:h-56 gradient-to-l overflow-hidden">
                {profile.header_url && (
                  <Image
                    src={profile.header_url}
                    alt="Capa do perfil"
                    fill
                    sizes="(max-width: 768px) 100vw, 896px"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="px-5 md:px-7 pb-6 relative">
                <div className="-mt-13 md:-mt-16 flex items-end justify-between gap-4">
                  <div className="rounded-full border-4 border-background-raised">
                    <Avatar src={profile.avatar_url} name={profile.name} sizes="xl" />
                  </div>
                </div>

                <div className="mt-4">
                  <h1 className="text-2xl font-black text-foreground tracking-tight">
                    {profile.name}
                  </h1>
                  <p className="text-subtitle">@{profile.username}</p>
                  {profile.follows_me && (
                    <span className="mt-1 inline-block rounded bg-background px-2 py-0.5 text-xs font-medium text-subtitle">
                      Segue você
                    </span>
                  )}
                  <p className="mt-3 text-foreground leading-relaxed max-w-2xl">
                    {profile.bio || "Sem bio."}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-subtitle">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPinIcon size={16} weight="fill" />
                    {profile.location || "Sem localização"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDotsIcon size={16} weight="fill" />
                    {profile.birthday || "Sem aniversário"}
                  </span>
                  {profile.website ? (
                    <Link
                      href={profile.website}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-foreground-brand hover:underline"
                    >
                      <GlobeHemisphereWestIcon size={16} weight="fill" />
                      {profile.website.replace(/^https?:\/\//, "")}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <GlobeHemisphereWestIcon size={16} weight="fill" />
                      Sem website
                    </span>
                  )}
                </div>

                <div className="mt-4 flex gap-6 text-sm">
                  <span className="text-foreground">
                    <strong className="font-extrabold">{profile.following_count}</strong>{" "}
                    <span className="text-subtitle">seguindo</span>
                  </span>
                  <span className="text-foreground">
                    <strong className="font-extrabold">{profile.followers_count}</strong>{" "}
                    <span className="text-subtitle">seguidores</span>
                  </span>
                </div>
              </div>

              <div className="border-t border-border-base px-5 md:px-7 py-2">
                <ul className="divide-y divide-border-base">
                  {postsLoading ? (
                    <li className="py-8 text-center text-foreground-muted">
                      Carregando posts...
                    </li>
                  ) : postsError ? (
                    <li className="py-8 text-center text-red-600">
                      Não foi possível carregar as publicações.
                    </li>
                  ) : posts.length === 0 ? (
                    <li className="py-8 text-center text-foreground-muted">
                      Sem novos posts por aqui.
                    </li>
                  ) : (
                    posts.map((post) => (
                      <li key={post.id} className="py-4">
                        <PostCard post={post} detailHref={`/post/${post.id}`} />
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          )}
        </section>
      </main>
      <MobileNav />
    </div>
  );
}
