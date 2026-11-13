"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isPathActive } from "./navItems";

// Barra inferior do celular. Usa a mesma lista de links do menu lateral.
export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Menu principal"
      className="flex justify-between items-center fixed bottom-0 sm:hidden w-dvw px-8 py-3 bg-background z-50"
    >
      {NAV_ITEMS.filter((item) => !item.desktopOnly).map(({ to, icon: Icon, label, exact }) => {
        const isActive = isPathActive(pathname, to, exact);
        return (
          <Link
            key={to}
            href={to}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className="hover:bg-background-raised flex items-center justify-center rounded-lg size-11"
          >
            <Icon
              color={isActive ? "var(--background-brand)" : "var(--subtitle)"}
              className="shrink-0"
              size={28}
              weight={isActive ? "fill" : "bold"}
            />
          </Link>
        );
      })}
    </nav>
  );
}
