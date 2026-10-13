"use client";

import { CheckIcon, GoogleLogoIcon } from "@phosphor-icons/react";
import * as Checkbox from "@radix-ui/react-checkbox";
import clsx from "clsx";
import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../lib/api";

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
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.trim())
        .eq("password", password.trim())
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error("Email ou senha inválidos");
      }

      localStorage.setItem("user", JSON.stringify(data));
      router.push("/");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh w-full bg-[url('/imagem_login.avif')] bg-cover bg-center p-2 sm:p-4 font-sans">
      <div className="grid min-h-[calc(100dvh-1rem)] grid-cols-1 overflow-hidden rounded-2xl border-2 border-white/80 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-950 sm:min-h-[calc(100dvh-2rem)] sm:rounded-3xl lg:grid-cols-2">
        <section className="relative hidden min-h-[300px] flex-col justify-between overflow-hidden bg-black p-8 text-white sm:p-10 lg:flex lg:p-12">
          <div className="absolute inset-0 bg-[url('/imagem_login.avif')] bg-cover bg-center opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />

          <span className="relative z-10 text-xl font-semibold tracking-widest text-orange-400 uppercase">
            Yourkurt
          </span>

          <div className="relative z-10 flex flex-col gap-4">
            <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-wide xl:text-6xl">
              Conecte.
              <br />
              Compartilhe.
              <br />
              Inspire.
            </h1>

            <p className="max-w-md text-base text-white/90 sm:text-lg">
              Entre e descubra pessoas, ideias e momentos incríveis.
            </p>
          </div>
        </section>

        <section className="flex min-w-0 flex-col justify-between gap-8 p-5 text-neutral-900 dark:text-neutral-100 sm:p-8 md:p-10 lg:p-8 xl:p-12">
          <div className="flex flex-col gap-2 lg:hidden">
            <span className="text-lg font-bold tracking-widest text-orange-600 dark:text-orange-400 uppercase">
              Yourkurt
            </span>

            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Conecte. Compartilhe. Inspire.
            </p>
          </div>

          <div className="hidden text-center lg:block">
            <p className="text-xl font-medium">Compartilhe sua jornada</p>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-3xl font-bold tracking-wide sm:text-4xl">
                Bem-vindo
              </h2>

              <p className="text-sm text-neutral-600 dark:text-neutral-300 sm:text-base">
                Insira seu e-mail e senha para acessar sua conta
              </p>
            </div>

            <form onSubmit={handleLogin} className="flex w-full flex-col gap-5">
              <label className="flex w-full flex-col gap-2 text-sm font-medium sm:text-base">
                E-mail
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-500 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-400"
                  placeholder="email@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="flex w-full flex-col gap-2 text-sm font-medium sm:text-base">
                Senha
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-500 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-400"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  required
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                <div className="flex items-center gap-2">
                  <Checkbox.Root
                    id="c1"
                    checked={checked}
                    onCheckedChange={setChecked}
                    className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-neutral-400 data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500"
                  >
                    <Checkbox.Indicator>
                      <CheckIcon weight="bold" className="text-white" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>

                  <label htmlFor="c1" className="cursor-pointer">
                    Lembrar-se
                  </label>
                </div>

                <span className="cursor-pointer text-orange-600 hover:underline dark:text-orange-400">
                  Esqueci minha senha
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-gr p-2 gradient-to-l px-4 py-3 font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>

              <button
                type="button"
                className="flex w-full it ems-center justify-center gap-2 rounded-lg border border-orange-400 px-4 py-3 font-medium text-neutral-800 transition hover:bg-orange-400/10 dark:text-neutral-100"
              >
                <GoogleLogoIcon weight="bold" size={20} />
                Entrar com o Google
              </button>
            </form>
          </div>

          <footer className="text-center text-sm text-neutral-600 dark:text-neutral-300">
            Não tem uma conta?{" "}
            <span className="cursor-pointer font-medium text-orange-600 underline dark:text-orange-400">
              Registrar
            </span>
          </footer>
        </section>
      </div>
    </main>
  );
}
