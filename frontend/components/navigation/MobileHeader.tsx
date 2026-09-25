"use client";

import { Avatar } from "../Avatar";
import { useCurrentProfile } from "@/lib/hooks/useCurrentProfile";

export default function MobileHeader() {
  const { profile } = useCurrentProfile();

  return (
    <header className="w-dvw h-20 fixed top-0 sm:hidden flex justify-between items-center bg-surface shadow-overflow-light dark:shadow-overflow-dark z-50 px-4">
      <h1 className="text-2xl font-black gradient-to-l text-transparent bg-clip-text">
        Yourkurt
      </h1>
      <Avatar sizes="lg" src={profile?.avatarUrl ?? null} name={profile?.name} />
    </header>
  );
}
