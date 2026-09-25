"use client";

import { CheckIcon, GoogleLogoIcon } from "@phosphor-icons/react";
import * as Checkbox from "@radix-ui/react-checkbox";
import clsx from "clsx";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function LoginPage() {
  const router = useRouter();
  const [checked, setChecked] = useState<boolean | "indeterminate">(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw new Error(error.message);
      if (!data.session || !data.user) throw new Error("Email ou senha inválidos");

      router.replace("/");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="bg-[url('/imagem_login.avif')] w-full h-dvh bg-cover p-4 font-sans">
        <div className={clsx("bg-surface rounded-4xl h-full justify-between flex gap-3 p-3 [mix-blend-mode:screen] dark:[mix-blend-mode:multiply]")}>
          <div className="bg-neutral-1100 flex flex-col w-full h-full justify-between px-12 py-8 rounded-[20px]" />
          <div className="justify-between px-12 py-8 flex flex-col w-full h-full rounded-[20px] items-center" />
        </div>
      </div>

      <div className="flex flex-col h-full justify-between px-12 py-8 rounded-[20px] absolute top-0 left-0 w-1/2">
        <span className="text-foreground-brand text-xl tracking-widest uppercase">Yourkurt</span>
        <div className="flex flex-col gap-3 text-foreground">
          <span className="w-1.5 text-6xl tracking-wider text-white font-semibold dark:text-foreground">
            Conecte. Compartilhe. Inspire.
          </span>
          <span className="text-xl text-white">Entre e descubra pessoas, ideias e momentos incríveis</span>
        </div>
      </div>

      <div className="justify-between px-12 py-8 flex flex-col h-full rounded-[20px] items-center right-0 top-0 absolute w-1/2">
        <span className="text-2xl items-center justify-center">Compartilhe sua jornada</span>

        <div className="flex flex-col gap-20 w-full items-center justify-center">
          <div className="gap-1 w-full flex flex-col items-center">
            <h1 className="text-4xl font-bold tracking-widest">Bem-vindo</h1>
            <h2 className="text-xl font-medium">Insira seu e-mail e senha para acessar sua conta</h2>
          </div>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-2.5 items-start justify-start max-w-2xl">
            <label className="flex flex-col w-full font-medium text-lg tracking-wide">
              E-mail
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-background-raised rounded-control border border-border-base text-foreground placeholder:text-foreground-muted focus:border-foreground-brand transition-colors"
                placeholder="email@example.com"
                required
              />
            </label>

            <label className="flex flex-col w-full font-medium text-lg tracking-wide">
              Senha
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-background-raised rounded-control border border-border-base text-foreground placeholder:text-foreground-muted focus:border-foreground-brand transition-colors"
                placeholder="Digite sua senha"
                required
              />
            </label>

            <div className="w-full flex justify-between text-sm text-subtitle">
              <div className="flex gap-2 items-center">
                <Checkbox.Root
                  id="c1"
                  checked={checked}
                  onCheckedChange={setChecked}
                  className="size-4 rounded-[4px] border border-border-base flex items-center justify-center data-[state=checked]:bg-background-brand data-[state=checked]:border-background-brand transition-colors"
                >
                  <Checkbox.Indicator>
                    <CheckIcon weight="bold" className="text-foreground-inverted" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <label htmlFor="c1">Lembrar-se</label>
              </div>
              <button type="button" className="hover:text-foreground-brand hover:underline">
                Esqueci minha senha
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="items-center justify-center flex w-full p-2 gradient-to-l rounded-control font-bold text-foreground-inverted hover:brightness-95 transition-all disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <button
              type="button"
              className="items-center justify-center flex w-full p-2 border border-background-brand rounded-control font-medium gap-1 text-foreground hover:bg-background-brand/10 transition-colors"
            >
              <GoogleLogoIcon weight="bold" />
              Entrar com o Google
            </button>
          </form>
        </div>

        <span>
          Não tem uma conta?{" "}
          <Link href="/signup" className="text-foreground-brand underline">
            Registrar
          </Link>
        </span>
      </div>
    </>
  );
}