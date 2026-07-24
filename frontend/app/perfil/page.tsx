"use client";

import { Avatar } from "@/components/Avatar";
import MobileHeader from "@/components/navigation/MobileHeader";
import MobileNav from "@/components/navigation/MobileNav";
import PageAside from "@/components/navigation/NavBar";
import ProfileSidebar from "@/components/navigation/ProfileSidebar";
import { createClient } from "@/lib/supabase/client";
import {
  CameraIcon,
  CalendarDotsIcon,
  ChatIcon,
  GearSixIcon,
  GlobeHemisphereWestIcon,
  HouseIcon,
  MapPinIcon,
  PencilSimpleLineIcon,
  UserIcon,
  UsersFourIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { type ChangeEvent, useEffect, useState } from "react";

type TabKey = "posts" | "replies" | "media";

type ProfileState = {
  id: string;
  name: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  birthday: string;
  avatarUrl: string;
  headerUrl: string;
};

const supabase = createClient();

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

const PROFILE_LINKS = [
  {
    text: "Feed",
    redirect: "/",
    icon: HouseIcon,
  },
  {
    text: "Perfil",
    redirect: "/perfil",
    icon: UserIcon,
  },
  {
    text: "Amigos",
    redirect: "/friends",
    icon: UsersIcon,
  },
  {
    text: "Comunidade",
    redirect: "/communities",
    icon: UsersFourIcon,
  },
  {
    text: "Mensagens",
    redirect: "/messages",
    icon: ChatIcon,
  },
  {
    text: "Configurações",
    redirect: "/settings",
    icon: GearSixIcon,
  },
];

const INITIAL_PROFILE: ProfileState = {
  id: "",
  name: "",
  username: "",
  bio: "",
  location: "",
  website: "",
  birthday: "",
  avatarUrl: "",
  headerUrl: "",
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "posts", label: "Posts" },
  { key: "replies", label: "Respostas" },
  { key: "media", label: "Mídia" },
];

const POST_ITEMS = [
  {
    id: "1",
    mood: "Hoje",
    text: "Desenhando a nova experiência de perfil do Esprokurt. Quero algo direto, bonito e com personalidade.",
    likes: 37,
    comments: 12,
  },
  {
    id: "2",
    mood: "Ontem",
    text: "Troquei alguns detalhes visuais e a navegação lateral ficou muito mais fluida.",
    likes: 21,
    comments: 4,
  },
  {
    id: "3",
    mood: "3 dias",
    text: "Rascunhando novas ideias para comunidades e curadoria de conteúdo.",
    likes: 14,
    comments: 3,
  },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileState>(INITIAL_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingHeader, setIsUploadingHeader] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      setSaveMessage("");

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        setSaveMessage("Não foi possível carregar o usuário autenticado.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, username, bio, location, website, birthday, avatar_url, header_url")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error) {
        setSaveMessage("Não foi possível carregar seu perfil.");
        setIsLoading(false);
        return;
      }

      const fallbackName =
        authUser.user_metadata?.name ??
        authUser.email?.split("@")[0] ??
        "Usuário";

      const fallbackUsername =
        authUser.user_metadata?.username ??
        authUser.email?.split("@")[0]?.toLowerCase() ??
        "usuario";

      setProfile({
        id: authUser.id,
        name: data?.name ?? fallbackName,
        username: data?.username ?? fallbackUsername,
        bio: data?.bio ?? "",
        location: data?.location ?? "",
        website: data?.website ?? "",
        birthday: data?.birthday ?? "",
        avatarUrl: data?.avatar_url ?? "",
        headerUrl: data?.header_url ?? "",
      });

      setIsLoading(false);
    }

    void loadProfile();
  }, []);

  function handleChange<K extends keyof ProfileState>(key: K, value: ProfileState[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveProfile() {
    setSaveMessage("");

    if (!profile.id) {
      setSaveMessage("Usuário não identificado para salvar perfil.");
      return;
    }

    const cleanUsername = profile.username.trim().toLowerCase();
    if (!/^([a-z0-9_.]{3,20})$/.test(cleanUsername)) {
      setSaveMessage("O usuário deve ter 3 a 20 caracteres (letras, números, _ ou .).");
      return;
    }

    const cleanWebsite = profile.website.trim();
    const normalizedWebsite =
      cleanWebsite && !/^https?:\/\//i.test(cleanWebsite)
        ? `https://${cleanWebsite}`
        : cleanWebsite;

    const { error } = await supabase.from("profiles").upsert(
      {
        id: profile.id,
        name: profile.name.trim(),
        username: cleanUsername,
        bio: profile.bio.trim() || null,
        location: profile.location.trim() || null,
        website: normalizedWebsite || null,
        birthday: profile.birthday || null,
        header_url: profile.headerUrl || null,
      },
      { onConflict: "id" },
    );

    if (error) {
      setSaveMessage("Erro ao salvar perfil. Tente novamente.");
      return;
    }

    setProfile((prev) => ({
      ...prev,
      username: cleanUsername,
      website: normalizedWebsite,
    }));

    setIsEditing(false);
    setSaveMessage("Perfil atualizado com sucesso.");
  }

  async function handleAvatarUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;
    if (!profile.id) {
      setSaveMessage("Usuário não identificado para atualizar a foto.");
      return;
    }

    setIsUploadingAvatar(true);
    setSaveMessage("");

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${profile.id}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      setSaveMessage(
        `Erro ao enviar foto (${uploadError.statusCode ?? "sem status"}): ${uploadError.message}. Verifique bucket avatars e policies.`,
      );
      setIsUploadingAvatar(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    const { error: persistError } = await supabase.from("profiles").upsert(
      {
        id: profile.id,
        name: profile.name.trim() || "Usuário",
        avatar_url: publicUrl,
      },
      { onConflict: "id" },
    );

    if (persistError) {
      setSaveMessage("Foto enviada, mas não foi possível salvar no perfil.");
      setIsUploadingAvatar(false);
      return;
    }

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (currentUser) {
      await supabase.auth.updateUser({
        data: {
          ...currentUser.user_metadata,
          avatar_url: publicUrl,
        },
      });
    }

    setProfile((prev) => ({ ...prev, avatarUrl: publicUrl }));
    setSaveMessage("Foto de perfil atualizada com sucesso.");
    setIsUploadingAvatar(false);
  }

  async function handleHeaderUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;
    if (!profile.id) {
      setSaveMessage("Usuário não identificado para atualizar a capa.");
      return;
    }

    setIsUploadingHeader(true);
    setSaveMessage("");

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${profile.id}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("headers")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      setSaveMessage(
        `Erro ao enviar capa (${uploadError.statusCode ?? "sem status"}): ${uploadError.message}. Verifique bucket headers e policies.`,
      );
      setIsUploadingHeader(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("headers").getPublicUrl(filePath);

    const { error: persistError } = await supabase.from("profiles").upsert(
      {
        id: profile.id,
        name: profile.name.trim() || "Usuário",
        header_url: publicUrl,
      },
      { onConflict: "id" },
    );

    if (persistError) {
      setSaveMessage("Capa enviada, mas não foi possível salvar no perfil.");
      setIsUploadingHeader(false);
      return;
    }

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (currentUser) {
      await supabase.auth.updateUser({
        data: {
          ...currentUser.user_metadata,
          header_url: publicUrl,
        },
      });
    }

    setProfile((prev) => ({ ...prev, headerUrl: publicUrl }));
    setSaveMessage("Header do perfil atualizado com sucesso.");
    setIsUploadingHeader(false);
  }

  const selectedTabEmptyState =
    activeTab === "posts"
      ? "Sem novos posts por aqui."
      : activeTab === "replies"
        ? "Nenhuma resposta ainda."
        : "Nenhuma mídia publicada ainda.";

  return (
    <div className="w-dvw min-h-dvh overflow-hidden relative flex h-screen items-center justify-center bg-background font-sans gap-4">
      <PageAside items={NAV_ITEMS} />
      <MobileHeader />

      <main className="overflow-auto h-dvh flex-1 w-full flex items-start justify-center pt-20 gap-4 sm:pt-12">
        <ProfileSidebar
          alt="Foto de perfil"
          size={1}
          prop={PROFILE_LINKS}
          name={profile.name || "Carregando..."}
          at={profile.username || "usuario"}
          src={profile.avatarUrl || null}
          headerUrl={profile.headerUrl || null}
        />

        <section className="w-full max-w-4xl px-3 md:px-4 pb-24 sm:pb-10">
          <div className="rounded-2xl overflow-hidden border border-border-base bg-background-raised">
            <div className="relative h-38 md:h-56 gradient-to-l overflow-hidden">
              {profile.headerUrl && (
                <Image
                  src={profile.headerUrl}
                  alt="Capa do perfil"
                  fill
                  sizes="(max-width: 768px) 100vw, 896px"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              {isEditing && (
                <label
                  htmlFor="header-upload"
                  className="absolute right-3 top-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border-base bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background"
                >
                  <CameraIcon size={14} weight="bold" />
                  {isUploadingHeader ? "Enviando capa..." : "Alterar capa"}
                </label>
              )}
              <input
                id="header-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleHeaderUpload}
                disabled={isUploadingHeader}
              />
            </div>

            <div className="px-5 md:px-7 pb-6 relative">
              <div className="-mt-13 md:-mt-16 flex items-end justify-between gap-4">
                <div className="flex flex-col items-start gap-2">
                  <div className="rounded-full border-4 border-background-raised">
                    <Avatar
                      src={profile.avatarUrl || null}
                      name={profile.name || "Usuário"}
                      sizes="xl"
                    />
                  </div>
                  {isEditing && (
                    <label
                      htmlFor="avatar-upload"
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border-base bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background-raised"
                    >
                      <CameraIcon size={14} weight="bold" />
                      {isUploadingAvatar ? "Enviando..." : "Trocar foto"}
                    </label>
                  )}
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
                  className="inline-flex items-center gap-2 rounded-full border border-border-base bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-background-raised"
                >
                  <PencilSimpleLineIcon size={16} weight="bold" />
                  {isEditing ? "Salvar alterações" : "Editar perfil"}
                </button>
              </div>

              {isEditing ? (
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                    Nome
                    <input
                      value={profile.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="rounded-lg border border-border-base bg-background px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                    Usuário
                    <input
                      value={profile.username}
                      onChange={(e) =>
                        handleChange("username", e.target.value.replace(/\s+/g, "").toLowerCase())
                      }
                      className="rounded-lg border border-border-base bg-background px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-foreground md:col-span-2">
                    Bio
                    <textarea
                      value={profile.bio}
                      onChange={(e) => handleChange("bio", e.target.value)}
                      className="min-h-24 rounded-lg border border-border-base bg-background px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                    Localização
                    <input
                      value={profile.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                      className="rounded-lg border border-border-base bg-background px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                    Website
                    <input
                      value={profile.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                      className="rounded-lg border border-border-base bg-background px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-foreground md:col-span-2">
                    Data de aniversário
                    <input
                      type="date"
                      value={profile.birthday}
                      onChange={(e) => handleChange("birthday", e.target.value)}
                      className="rounded-lg border border-border-base bg-background px-3 py-2"
                    />
                  </label>
                </div>
              ) : (
                <>
                  <div className="mt-4">
                    <h1 className="text-2xl font-black text-foreground tracking-tight">
                      {profile.name || "Usuário"}
                    </h1>
                    <p className="text-subtitle">@{profile.username || "usuario"}</p>
                    <p className="mt-3 text-foreground leading-relaxed max-w-2xl">
                      {profile.bio || "Adicione uma bio para aparecer aqui."}
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
                      <strong className="font-extrabold">128</strong>{" "}
                      <span className="text-subtitle">seguindo</span>
                    </span>
                    <span className="text-foreground">
                      <strong className="font-extrabold">2.4k</strong>{" "}
                      <span className="text-subtitle">seguidores</span>
                    </span>
                  </div>
                </>
              )}

              {isLoading && (
                <p className="mt-4 text-sm text-subtitle">Carregando dados do perfil...</p>
              )}

              {saveMessage && (
                <p className="mt-4 rounded-lg border border-border-base bg-background px-3 py-2 text-sm text-foreground">
                  {saveMessage}
                </p>
              )}
            </div>

            <div className="border-t border-border-base">
              <div className="grid grid-cols-3">
                {TABS.map((tab) => {
                  const active = tab.key === activeTab;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-3 text-sm font-bold transition-colors ${
                        active
                          ? "text-foreground border-b-2 border-background-brand"
                          : "text-subtitle hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="px-5 md:px-7 py-2">
                {activeTab === "posts" ? (
                  <ul className="divide-y divide-border-base">
                    {POST_ITEMS.map((post) => (
                      <li key={post.id} className="py-4 flex items-start gap-3">
                        <Avatar src={profile.avatarUrl || null} name={profile.name} sizes="lg" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-bold text-foreground">
                              {profile.name || "Usuário"}
                            </span>
                            <span className="text-subtitle">
                              @{profile.username || "usuario"}
                            </span>
                            <span className="text-subtitle">· {post.mood}</span>
                          </div>
                          <p className="mt-1 text-foreground">{post.text}</p>
                          <div className="mt-2 flex gap-5 text-sm text-subtitle">
                            <span>{post.comments} respostas</span>
                            <span>{post.likes} curtidas</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-8 text-center text-subtitle text-sm">
                    {selectedTabEmptyState}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <MobileNav />
    </div>
  );
}
