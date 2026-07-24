import Script from "next/script";

export default function ThemeScript() {
  const script = `
(() => {
  try {
    const saved = localStorage.getItem("esprokurt-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved === "light" || saved === "dark" ? saved : (prefersDark ? "dark" : "light");
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", theme === "dark");
  } catch {
    // no-op
  }
})();`;

  return (
    <Script id="esprokurt-theme-script" strategy="beforeInteractive">
      {script}
    </Script>
  );
}
