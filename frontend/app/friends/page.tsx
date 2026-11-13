"use client";

import { Avatar } from "@/components/Avatar";
import MobileHeader from "@/components/navigation/MobileHeader";
import MobileNav from "@/components/navigation/MobileNav";
import PageAside from "@/components/navigation/NavBar";
import ProfileSidebar from "@/components/navigation/ProfileSidebar";
import { useCurrentProfile } from "@/lib/hooks/useCurrentProfile";
import { type FollowListKind, type FollowPerson, useFollowList } from "@/lib/hooks/useFriends";
import { profileHref } from "@/lib/profile";
import Link from "next/link";
import { useState } from "react";

const TABS: { kind: FollowListKind; label: string; empty: string }[] = [
  {
    kind: "friends",
    label: "Amigos",
    empty:
      "Você ainda não tem amigos. Quando alguém que você segue seguir você de volta, essa pessoa aparece aqui.",
  },
  {
    kind: "followers",
    label: "Seguidores",
    empty: "Ninguém segue você ainda.",
  },
  {
    kind: "following",
    label: "Seguindo",
    empty: "Você ainda não segue ninguém. Abra o perfil de alguém e toque em Seguir.",
  },
];

function PersonRow({ person, kind }: { person: FollowPerson; kind: FollowListKind }) {
  const href = profileHref(person.username);
  const badges = [
    kind !== "friends" && person.is_friend ? "Amigo" : null,
    person.follow_status === "pending" ? "Pedido enviado" : null,
  ].filter(Boolean) as string[];

  const content = (
    <>
      <Avatar src={person.avatar_url} name={person.name} sizes="sm" decorative />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-bold text-foreground">{person.name}</span>
        <span className="truncate text-sm text-subtitle">@{person.username}</span>
      </span>
      {badges.map((badge) => (
        <span
          key={badge}
          className="shrink-0 rounded-full border border-border-base px-2.5 py-0.5 text-xs font-semibold text-subtitle"
        >
          {badge}
        </span>
      ))}
    </>
  );

  return (
    <li>
      {href ? (
        <Link
          href={href}
          className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-background-raised"
        >
          {content}
        </Link>
      ) : (
        <div className="flex items-center gap-3 px-5 py-3">{content}</div>
      )}
    </li>
  );
}

export default function FriendsPage() {
  const { profile } = useCurrentProfile();
  const [activeKind, setActiveKind] = useState<FollowListKind>("friends");

  // As três listas carregam juntas para mostrar o total em cada aba.
  const lists = {
    friends: useFollowList("friends"),
    followers: useFollowList("followers"),
    following: useFollowList("following"),
  };
  const activeTab = TABS.find((tab) => tab.kind === activeKind) ?? TABS[0];
  const active = lists[activeKind];

  return (
    <div className="w-dvw min-h-dvh overflow-hidden relative flex h-screen items-center justify-center bg-background font-sans gap-4">
      <PageAside />
      <MobileHeader />
      <main className="overflow-auto h-dvh flex-1 w-full flex items-start justify-center pt-20 gap-4 sm:pt-12">
        <ProfileSidebar
          alt="Foto de perfil"
          size={1}
          name={profile?.name ?? "Carregando..."}
          at={profile?.username ?? "usuario"}
          src={profile?.avatarUrl ?? null}
          headerUrl={profile?.headerUrl}
        />
        <section className="w-full max-w-4xl px-3 md:px-4 pb-24 sm:pb-10">
          <div className="rounded-card overflow-hidden border border-border-base bg-surface shadow-card">
            <header className="border-b border-border-base px-5 py-5">
              <h1 className="text-xl font-black text-foreground">Amigos</h1>
              <p className="mt-1 text-sm text-subtitle">
                Amigos são as pessoas que você segue e que seguem você de volta.
              </p>
            </header>

            <div className="grid grid-cols-3 border-b border-border-base">
              {TABS.map((tab) => {
                const isActive = tab.kind === activeKind;
                const list = lists[tab.kind];
                return (
                  <button
                    key={tab.kind}
                    type="button"
                    onClick={() => setActiveKind(tab.kind)}
                    aria-pressed={isActive}
                    className={`px-2 py-3 text-sm font-bold transition-colors ${
                      isActive
                        ? "text-foreground border-b-2 border-background-brand"
                        : "text-subtitle hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {!list.loading && <span className="font-medium"> ({list.total})</span>}
                  </button>
                );
              })}
            </div>

            {active.loading ? (
              <p className="px-5 py-8 text-center text-subtitle">Carregando...</p>
            ) : active.error ? (
              <p role="alert" className="px-5 py-8 text-center text-sm text-red-600">
                {active.error}
              </p>
            ) : active.people.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
                <p className="max-w-sm text-sm text-subtitle">{activeTab.empty}</p>
                {activeKind === "friends" && lists.followers.total > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveKind("followers")}
                    className="text-sm font-semibold text-foreground-brand hover:underline"
                  >
                    Ver quem segue você
                  </button>
                )}
              </div>
            ) : (
              <ul aria-label={activeTab.label} className="divide-y divide-border-base">
                {active.people.map((person) => (
                  <PersonRow key={person.id} person={person} kind={activeKind} />
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <MobileNav />
    </div>
  );
}
