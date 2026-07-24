"use client";

import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getThemeFromDom(): Theme {
  if (typeof document === "undefined") return "light";
  const root = document.documentElement;
  const explicitTheme = root.dataset.theme;

  if (explicitTheme === "light" || explicitTheme === "dark") {
    return explicitTheme;
  }

  if (root.classList.contains("dark")) {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  localStorage.setItem("esprokurt-theme", theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(getThemeFromDom());
  }, []);

  const isDark = theme === "dark";

  function handleToggle() {
    const nextTheme: Theme = isDark ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      className="group flex w-full items-center justify-between rounded-xl border border-border-base bg-background px-4 py-3 transition-colors hover:bg-background-raised"
    >
      <span className="flex items-center gap-3">
        <span className="rounded-lg bg-background-raised p-2">
          {isDark ? (
            <MoonIcon weight="fill" size={20} className="text-foreground-brand" />
          ) : (
            <SunIcon weight="fill" size={20} className="text-foreground-brand" />
          )}
        </span>
        <span className="text-left">
          <span className="block text-sm font-semibold text-foreground">
            Aparência
          </span>
          <span className="block text-sm text-subtitle">
            {isDark ? "Modo escuro ativado" : "Modo claro ativado"}
          </span>
        </span>
      </span>

      <span
        className="relative inline-flex h-7 w-12 items-center rounded-full bg-background-raised p-1 transition-colors"
        aria-hidden="true"
      >
        <span
          className={`inline-block size-5 rounded-full bg-background-brand transition-transform ${
            isDark ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
