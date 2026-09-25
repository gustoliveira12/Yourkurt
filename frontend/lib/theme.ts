import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

export function getThemeFromDom(): Theme {
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

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  localStorage.setItem("yourkurt-theme", theme);
}

// Reads the theme applied by the inline script in ThemeScript.tsx without a setState-in-effect.
export function useThemeFromDom() {
  return useSyncExternalStore(
    () => () => {},
    getThemeFromDom,
    () => "light",
  );
}
