import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página não encontrada | Yourkurt",
};

export default function NotFound() {
  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <span className="text-sm font-black tracking-wide text-foreground-brand">
        Yourkurt
      </span>
      <h1 className="text-8xl font-black tracking-tight text-foreground">
        404
      </h1>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">
          Página não encontrada
        </h2>
        <p className="max-w-sm text-sm text-subtitle">
          O endereço que você tentou acessar não existe ou foi removido.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-orange-500 px-5 py-3 font-bold text-white transition hover:brightness-95"
      >
        Voltar para o início
      </Link>
    </main>
  );
}
