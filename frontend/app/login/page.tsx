"use client";
import MobileNav from "@/components/navegacao/MobileNav";
import MobileHeader from "@/components/navegacao/MobileHeader";
import ProfileSidebar from "@/components/navegacao/ProfileSidebar";
import { user } from "@/lib/user";
import {
  HouseIcon,
  SquareIcon,
  CheckIcon,
  GoogleLogoIcon,
} from "@phosphor-icons/react";
import * as Checkbox from "@radix-ui/react-checkbox";
import { useState } from "react";
import clsx from "clsx";

export default function LoginPage() {
  const [checked, setChecked] = useState<boolean | "indeterminate">(false);
  return (
    <>
      <div className="bg-[url('/imagem_login.avif')] w-full h-dvh bg-cover p-4 font-sans">
        <div
          className={clsx(
            "bg-white dark:bg-black rounded-4xl h-full justify-between flex gap-3 p-3 [mix-blend-mode:screen] dark:[mix-blend-mode:multiply]",
          )}
        >
          {/**Esquerda */}
          <div className="bg-black dark:bg-white flex flex-col w-full h-full justify-between px-12 py-8 rounded-[20px]"></div>
          {/** Direita */}
          <div className="justify-between px-12 py-8 flex flex-col w-full h-full rounded-[20px] items-center"></div>
        </div>
      </div>
      <div className="flex flex-col h-full justify-between px-12 py-8 rounded-[20px] absolute top-0 left-0 w-1/2">
        <span className="text-foreground-brand text-xl tracking-widest uppercase">
          Esprokurt
        </span>
        <div className="flex flex-col gap-3 text-foreground">
          <span className="w-1.5 text-6xl tracking-wider text-white font-semibold dark:text-foreground">
            Conecte. Compartilhe. Inspire.
          </span>
          <span className="text-xl text-white">
            Entre e descubra pessoas, ideias e momentos incríveis
          </span>
        </div>
      </div>
      <div className="justify-between px-12 py-8 flex flex-col h-full rounded-[20px] items-center right-0 top-0 absolute w-1/2">
        <span className="text-2xl items-center justify-center">
          Compartilhe sua jornada
        </span>
        <div className="flex flex-col gap-20 w-full items-center justify-center">
          <div className="gap-1 w-full flex flex-col items-center">
            <h1 className="text-4xl font-bold tracking-widest">Bem-vindo</h1>
            <h2 className="text-xl font-medium">
              Insira seu e-mail e senha para acessar sua conta
            </h2>
          </div>
          <form className="w-full flex flex-col gap-2.5 items-start justify-start max-w-2xl">
            <label className="flex flex-col w-full font-medium text-lg tracking-wide">
              E-mail
              <input
                type="email"
                className="w-full px-4 py-2 bg-background-raised rounded-sm text-foreground placeholder:text-foreground-muted"
                placeholder="email@example.com"
              />
            </label>
            <label className="flex flex-col w-full">
              Senha
              <input
                className="w-full px-4 py-2 bg-background-raised rounded-sm text-foreground placeholder:text-foreground-muted text-lg"
                type="password"
                placeholder="Digite sua senha"
              />
            </label>
            <div className="w-full flex justify-between">
              <div className="flex gap-1 items-center">
                <Checkbox.Root
                  className="size-4 rounded-sm border border-border-base flex items-center justify-center data-[state=checked]:bg-background-brand"
                  id="c1"
                  onCheckedChange={setChecked}
                  checked={checked}
                >
                  <Checkbox.Indicator>
                    {checked === "indeterminate" ? (
                      <CheckIcon />
                    ) : (
                      <CheckIcon
                        weight="bold"
                        className="text-foreground-inverted"
                      />
                    )}
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <label htmlFor="c1">Lembrar-se</label>
              </div>
              <div className="">Esqueci minha senha</div>
            </div>
            <button className="items-center justify-center flex w-full p-2 gradient-to-l rounded-lg font-bold">
              Entrar
            </button>
            <button className="items-center justify-center flex w-full p-2 border border-background-brand rounded-lg font-medium gap-1">
              <GoogleLogoIcon weight="bold" /> Entrar com o Google
            </button>
          </form>
        </div>
        <span>Não tem uma conta? Registrar</span>
      </div>
    </>
  );
}
