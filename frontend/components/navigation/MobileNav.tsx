"use client";
import {
  ChatIcon,
  HouseIcon,
  PlusIcon,
  UserIcon,
  UsersFourIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex justify-between item-center fixed bottom-0 sm:hidden w-dvw px-12 py-4 bg-background z-50">
      <Link
        className="hover:bg-background-raised flex items-center rounded-lg"
        href="/"
      >
        <HouseIcon
          color={
            pathname === "/" ? "var(--background-brand)" : "var(--subtitle)"
          }
          className="shrink-0"
          size={28}
          weight={pathname === "/" ? "fill" : "bold"}
        />
      </Link>
      <Link
        className="hover:bg-background-raised flex items-center rounded-lg"
        href="/NewPost"
      >
        <PlusIcon
          color={
            pathname === "/NewPost"
              ? "var(--background-brand)"
              : "var(--subtitle)"
          }
          className="shrink-0"
          size={28}
          weight={pathname === "/NewPost" ? "fill" : "bold"}
        />
      </Link>
      <Link
        className="hover:bg-background-raised flex items-center rounded-lg"
        href="/"
      >
        <UsersIcon
          color={
            pathname === "/Amigos"
              ? "var(--background-brand)"
              : "var(--subtitle)"
          }
          className="shrink-0"
          size={28}
          weight={pathname === "/Amigos" ? "fill" : "bold"}
        />
      </Link>
      <Link
        className="hover:bg-background-raised flex items-center rounded-lg"
        href="/"
      >
        <UsersFourIcon
          color={
            pathname === "/Comunidades"
              ? "var(--background-brand)"
              : "var(--subtitle)"
          }
          className="shrink-0"
          size={28}
          weight={pathname === "/Comunidades" ? "fill" : "bold"}
        />
      </Link>
      <Link
        className="hover:bg-background-raised flex items-center rounded-lg"
        href="/"
      >
        <ChatIcon
          color={
            pathname === "/Mensagens"
              ? "var(--background-brand)"
              : "var(--subtitle)"
          }
          className="shrink-0"
          size={28}
          weight={pathname === "/Mensagens" ? "fill" : "bold"}
        />
      </Link>
    </nav>
  );
}
