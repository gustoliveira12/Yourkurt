"use client";

import { Avatar } from "@/components/Avatar";
import MobileHeader from "@/components/navigation/MobileHeader";
import MobileNav from "@/components/navigation/MobileNav";
import PageAside from "@/components/navigation/NavBar";
import ProfileSidebar from "@/components/navigation/ProfileSidebar";
import { useCurrentProfile } from "@/lib/hooks/useCurrentProfile";
import { createClient } from "@/lib/supabase/client";
import {
  GearSixIcon,
  HouseIcon,
  UserIcon,
  UsersFourIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Notification = {
  id: string;
  type: string;
  created_at: string;
  read_at: string | null;
  actor: { name: string | null; username: string | null; avatar_url: string | null } | null;
};

const supabase = createClient();
const PAGE_SIZE = 30;
const NAV_ITEMS = [
  { label: "Feed", to: "/", icon: HouseIcon },
  { label: "Perfil", to: "/perfil", icon: UserIcon },
  { label: "Amigos", to: "/friends", icon: UsersIcon },
  { label: "Comunidade", to: "/communities", icon: UsersFourIcon },
  { label: "Configurações", to: "/settings", icon: GearSixIcon },
];

function fetchNotifications(userId: string, cursor?: Pick<Notification, "created_at" | "id">) {
  let query = supabase
    .from("notifications")
    .select<string, Notification>(
      "id, type, created_at, read_at, actor:profiles!notifications_actor_id_fkey(name, username, avatar_url)",
    )
    .eq("user_id", userId);

  if (cursor) {
    query = query.or(
      `created_at.lt."${cursor.created_at}",and(created_at.eq."${cursor.created_at}",id.lt.${cursor.id})`,
    );
  }

  return query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE);
}

export default function NotificationsPage() {
  const { profile, loading: profileLoading, error: profileError } = useCurrentProfile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [markingRead, setMarkingRead] = useState(false);
  const userId = profile?.id;

  async function loadNotifications() {
    if (!userId) return;
    setLoading(true);
    setError("");
    const cursor = notifications[notifications.length - 1];
    const { data, error: queryError } = await fetchNotifications(userId, cursor);

    if (queryError) {
      console.error("Erro ao carregar notificações:", queryError);
      setError("Não foi possível carregar as notificações. Tente novamente.");
    } else {
      setNotifications((previous) => cursor ? [...previous, ...data] : data);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function loadInitialNotifications(id: string) {
      const { data, error: queryError } = await fetchNotifications(id);
      if (!active) return;
      if (queryError) {
        console.error("Erro ao carregar notificações:", queryError);
        setError("Não foi possível carregar as notificações. Tente novamente.");
      } else {
        setNotifications(data);
        setHasMore(data.length === PAGE_SIZE);
      }
      setLoading(false);
    }

    void loadInitialNotifications(userId);
    return () => { active = false; };
  }, [userId]);

  async function markAllRead() {
    if (!userId) return;
    setMarkingRead(true);
    setError("");
    const readAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .eq("user_id", userId)
      .is("read_at", null);

    if (updateError) {
      console.error("Erro ao marcar notificações como lidas:", updateError);
      setError("Não foi possível marcar as notificações como lidas.");
    } else {
      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          read_at: notification.read_at ?? readAt,
        })),
      );
    }
    setMarkingRead(false);
  }

  return (
    <div className="w-dvw min-h-dvh overflow-hidden relative flex h-screen items-center justify-center bg-background font-sans gap-4">
      <PageAside items={NAV_ITEMS} />
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
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-base px-5 py-5">
              <h1 className="text-xl font-black text-foreground">Notificações</h1>
              <button
                type="button"
                onClick={markAllRead}
                disabled={markingRead || loading || !userId || notifications.length === 0}
                className="text-sm font-semibold text-foreground-brand hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {markingRead ? "Marcando..." : "Marcar todas como lidas"}
              </button>
            </div>
            {error && <p role="alert" className="px-5 py-3 text-sm text-red-600">{error}</p>}
            {!userId && !profileLoading && (
              <p role="alert" className="px-5 py-8 text-center text-sm text-red-600">
                {profileError ? "Não foi possível carregar seu usuário." : "Entre para ver suas notificações."}
              </p>
            )}
            {profileLoading || (userId && loading && notifications.length === 0) ? (
              <p className="px-5 py-8 text-center text-subtitle">Carregando notificações...</p>
            ) : userId && !error && notifications.length === 0 ? (
              <p className="px-5 py-8 text-center text-subtitle">Nenhuma notificação ainda.</p>
            ) : (
              <ul className="divide-y divide-border-base">
                {notifications.map((notification) => {
                  const actorName = notification.actor?.name || "Usuário";
                  const actorUsername = notification.actor?.username;
                  return (
                    <li key={notification.id} className={`flex gap-3 px-5 py-4 ${notification.read_at ? "" : "bg-background-raised"}`}>
                      <Avatar src={notification.actor?.avatar_url} name={actorName} />
                      <div className="min-w-0 text-sm text-foreground">
                        {actorUsername ? (
                          <Link href={`/perfil/${encodeURIComponent(actorUsername)}`} className="font-bold hover:underline">
                            {actorName}
                          </Link>
                        ) : (
                          <span className="font-bold">{actorName}</span>
                        )}{" "}
                        {notification.type === "follow" ? "começou a seguir você." : "enviou uma notificação."}
                        {!notification.read_at && <span className="ml-2 text-xs font-semibold text-foreground-brand">Nova</span>}
                        <time dateTime={notification.created_at} className="mt-1 block text-xs text-subtitle">
                          {new Date(notification.created_at).toLocaleString("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </time>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {userId && hasMore && (
              <div className="px-5 py-4 text-center">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void loadNotifications()}
                  className="text-sm font-semibold text-foreground-brand hover:underline disabled:opacity-50"
                >
                  {loading ? "Carregando..." : error ? "Tentar novamente" : "Carregar mais"}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <MobileNav />
    </div>
  );
}
