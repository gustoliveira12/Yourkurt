"use client";

import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useState } from "react";
import clsx from "clsx";
import { applyTheme, useThemeFromDom, type Theme } from "@/lib/theme";

type ThemeToggleCompactProps = {
  isOpen?: boolean;
};

export default function ThemeToggleCompact({ isOpen }: ThemeToggleCompactProps) {
  const domTheme = useThemeFromDom();
  const [overrideTheme, setOverrideTheme] = useState<Theme | null>(null);
  const theme = overrideTheme ?? domTheme;

  const isDark = theme === "dark";

  function handleToggle() {
    const nextTheme: Theme = isDark ? "light" : "dark";
    setOverrideTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      onClick={handleToggle}
      className={clsx(
        "p-2 rounded-lg text-subtitle hover:bg-background-raised hover:text-foreground-brand transition-colors",
        isOpen && "self-start",
      )}
    >
      {isDark ? (
        <MoonIcon weight="fill" size={28} />
      ) : (
        <SunIcon weight="fill" size={28} />
      )}
    </button>
  );
}
