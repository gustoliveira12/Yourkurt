"use client";
import MobileNav from "@/components/navegacao/MobileNav";
import MobileHeader from "@/components/navegacao/MobileHeader";
import ProfileSidebar from "@/components/navegacao/ProfileSidebar";
import { user } from "@/lib/user";
import { HouseIcon } from "@phosphor-icons/react";

export default function LoginPage() {
  return (
    <div className="bg-[url('/imagem_login.avif')] w-full h-dvh bg-cover p-4 font-sans">
      <div className="bg-background rounded-4xl h-full justify-between flex gap-3 p-3">
        {/**Esquerda */}
        <div className="flex flex-col w-full h-full justify-between px-12 py-8 rounded-[20px]">
          <span className="text-foreground-brand text-xl tracking-widest uppercase">
            Esprokurt
          </span>
          <div className="flex flex-col gap-3 text-foreground">
            <span className="w-1.5 text-6xl  tracking-wider font-semibold">
              Conecte. Compartilhe. Inspire.
            </span>
            <span className="text-xl">
              Entre e descubra pessoas, ideias e momentos incríveis
            </span>
          </div>
        </div>
        {/** Direita */}
        <div className="justify-between px-12 py-8 flex flex-col w-full h-full rounded-[20px] items-center">
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
              <label className="flex flex-col">
                E-mail
                <input placeholder="email@example.com" />
              </label>
              <label className="flex flex-col">
                Senha
                <input type="password" placeholder="Digite sua senha" />
              </label>
              <div className="w-full flex justify-between">
                <div className="text-start justify-start">Lembrar-se</div>
                <div className="">Esqueci minha senha</div>
              </div>
            </form>
          </div>
          <span>Não tem uma conta? Registrar</span>
        </div>
      </div>
    </div>
  );
}
