"use client";

import MobileHeader from "@/components/navigation/MobileHeader";
import MobileNav from "@/components/navigation/MobileNav";
import PageAside from "@/components/navigation/NavBar";
import ProfileSidebar from "@/components/navigation/ProfileSidebar";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { user } from "@/lib/user";
import {
  BellIcon,
  ChatIcon,
  GearSixIcon,
  HouseIcon,
  LockKeyIcon,
  ShieldCheckIcon,
  UserIcon,
  UsersFourIcon,
  UsersIcon,
} from "@phosphor-icons/react";

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

function SettingsCard({
  title,
  subtitle,
  icon,
  actionText,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  actionText: string;
}) {
  return (
    <div className="rounded-xl border border-border-base bg-background-raised p-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-background p-2 text-foreground-brand">
          {icon}
        </span>
        <div className="flex flex-col">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-subtitle">{subtitle}</p>
        </div>
      </div>
      <button
        type="button"
        className="rounded-lg border border-border-base px-3 py-2 text-sm font-semibold text-foreground hover:bg-background"
      >
        {actionText}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="w-dvw min-h-dvh overflow-hidden relative flex h-screen items-center justify-center bg-background font-sans gap-4">
      <PageAside items={NAV_ITEMS} />
      <MobileHeader />

      <main className="overflow-auto h-dvh flex-1 w-full flex items-start justify-center pt-20 gap-4 sm:pt-12">
        <ProfileSidebar
          alt="Foto de perfil"
          size={1}
          prop={PROFILE_LINKS}
          name="Lucas Silva"
          at="lucas.silva"
          src={user.img}
        />

        <section className="w-full max-w-4xl px-3 md:px-4 pb-24 sm:pb-10">
          <div className="rounded-2xl bg-background-raised border border-border-base p-6 md:p-8 flex flex-col gap-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                  Configurações
                </h1>
                <p className="text-subtitle mt-1">
                  Ajuste preferências da sua conta e personalize sua experiência.
                </p>
              </div>
              <span className="hidden md:inline-flex text-xs uppercase font-bold tracking-wider text-foreground-brand bg-background px-3 py-2 rounded-full">
                Conta
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-subtitle">
                Aparência
              </h2>
              <ThemeToggle />
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-subtitle">
                Privacidade e Segurança
              </h2>
              <SettingsCard
                title="Privacidade do perfil"
                subtitle="Controle quem pode ver suas publicações e informações pessoais."
                actionText="Gerenciar"
                icon={<ShieldCheckIcon size={18} weight="fill" />}
              />
              <SettingsCard
                title="Senha e autenticação"
                subtitle="Atualize sua senha e fortaleça sua segurança de acesso."
                actionText="Atualizar"
                icon={<LockKeyIcon size={18} weight="fill" />}
              />
              <SettingsCard
                title="Notificações"
                subtitle="Defina quando e como você deseja ser notificado."
                actionText="Configurar"
                icon={<BellIcon size={18} weight="fill" />}
              />
            </div>
          </div>
        </section>
      </main>

      <MobileNav />
    </div>
  );
}
