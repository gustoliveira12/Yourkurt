"use client";
import {
  GearSixIcon,
  HouseIcon,
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
        href="/perfil"
      >
        <UserIcon
          color={
            pathname === "/perfil"
              ? "var(--background-brand)"
              : "var(--subtitle)"
          }
          className="shrink-0"
          size={28}
          weight={pathname === "/perfil" ? "fill" : "bold"}
        />
      </Link>
      <Link
        className="hover:bg-background-raised flex items-center rounded-lg"
        href="/"
        aria-disabled="true"
        onClick={(event) => event.preventDefault()}
      >
        <UsersIcon
          color={
            "var(--subtitle)"
          }
          className="shrink-0 opacity-50"
          size={28}
          weight="bold"
        />
      </Link>
      <Link
        className="hover:bg-background-raised flex items-center rounded-lg"
        href="/"
        aria-disabled="true"
        onClick={(event) => event.preventDefault()}
      >
        <UsersFourIcon
          color={
            "var(--subtitle)"
          }
          className="shrink-0 opacity-50"
          size={28}
          weight="bold"
        />
      </Link>
      <Link
        className="hover:bg-background-raised flex items-center rounded-lg"
        href="/settings"
      >
        <GearSixIcon
          color={
            pathname === "/settings"
              ? "var(--background-brand)"
              : "var(--subtitle)"
          }
          className="shrink-0"
          size={28}
          weight={pathname === "/settings" ? "fill" : "bold"}
        />
      </Link>
    </nav>
  );
}
