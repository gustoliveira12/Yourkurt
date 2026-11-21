"use client";

import { Avatar } from "../Avatar";
import { useCurrentProfile } from "@/lib/hooks/useCurrentProfile";
import { useUnreadNotifications } from "@/lib/hooks/useUnreadNotifications";
import { NotificationBadge, unreadLabel } from "./NotificationBadge";
import ThemeToggleCompact from "@/components/theme/ThemeToggleCompact";
import { BellIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileHeader() {
  const { profile } = useCurrentProfile();
  const isNotifications = usePathname() === "/notificacoes";
  const unread = useUnreadNotifications();

  return (
    <header className="w-dvw h-20 fixed top-0 sm:hidden flex justify-between items-center bg-surface shadow-overflow-light dark:shadow-overflow-dark z-50 px-4">
      {/* Logo, não título: cada página tem o próprio h1. */}
      <Link href="/" className="text-2xl font-black gradient-to-l text-transparent bg-clip-text">
        Yourkurt
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/notificacoes"
          aria-label={unreadLabel(unread)}
          aria-current={isNotifications ? "page" : undefined}
          className="rounded-lg p-2 text-subtitle hover:bg-background-raised"
        >
          <span className="relative block">
            <BellIcon size={24} weight={isNotifications ? "fill" : "bold"} />
            <NotificationBadge count={unread} />
          </span>
        </Link>
        <ThemeToggleCompact />
        <Avatar sizes="lg" src={profile?.avatarUrl ?? null} name={profile?.name} />
      </div>
    </header>
  );
}
