"use client";

import {
  BellSimpleRingingIcon,
  GlobeHemisphereWestIcon,
  LockSimpleIcon,
  PaletteIcon,
  UserCirclePlusIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [themePreference, setThemePreference] = useState<"system" | "light" | "dark">(
    "system",
  );
  const [receiveProductUpdates, setReceiveProductUpdates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleanUsername = username.trim().toLowerCase();

    if (!name.trim()) {
      setMessage("Informe seu nome para criar o perfil.");
      return;
    }

    if (!/^([a-z0-9_.]{3,20})$/.test(cleanUsername)) {
      setMessage("Seu usuário deve ter 3 a 20 caracteres (letras, números, _ ou .).");
      return;
    }

    if (!email.trim()) {
      setMessage("Informe um e-mail válido para continuar.");
      return;
    }

    if (!password.trim()) {
      setMessage("A senha é obrigatória.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const emailRedirectTo = origin
        ? `${origin}/auth/confirm?next=/`
        : undefined;

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo,
          data: {
            name: name.trim(),
            username: cleanUsername,
            bio: bio.trim(),
            profile_visibility: isPrivateProfile ? "private" : "public",
            theme_preference: themePreference,
            receive_product_updates: receiveProductUpdates,
          },
        },
      });

      if (error) throw new Error(error.message);

      const encodedEmail = encodeURIComponent(email.trim());
      router.replace(`/signup/verify-email?email=${encodedEmail}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh w-full bg-background p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-border-base bg-background-raised p-6 md:p-10">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-background px-3 py-1 text-xs font-bold uppercase tracking-widest text-foreground-brand">
                Novo perfil
              </span>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-4xl">
                Crie sua conta
              </h1>
              <p className="mt-2 max-w-lg text-subtitle">
                Monte seu perfil em poucos passos e escolha como você quer aparecer
                na comunidade.
              </p>
            </div>
            <UserCirclePlusIcon
              size={40}
              weight="duotone"
              className="text-foreground-brand"
            />
          </div>

          <form onSubmit={handleSignUp} className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground md:col-span-1">
              Nome de exibição *
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border border-border-base bg-background px-3.5 py-2.5 text-foreground placeholder:text-foreground-muted"
                placeholder="Ex.: Lucas Silva"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground md:col-span-1">
              Usuário *
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
                className="rounded-xl border border-border-base bg-background px-3.5 py-2.5 text-foreground placeholder:text-foreground-muted"
                placeholder="ex.: lucas.silva"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground md:col-span-2">
              E-mail *
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-border-base bg-background px-3.5 py-2.5 text-foreground placeholder:text-foreground-muted"
                placeholder="email@example.com"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground md:col-span-2">
              Bio inicial (opcional)
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="min-h-24 rounded-xl border border-border-base bg-background px-3.5 py-2.5 text-foreground placeholder:text-foreground-muted"
                placeholder="Conte em uma frase o que você curte compartilhar"
                maxLength={120}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground md:col-span-1">
              Senha *
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                className="rounded-xl border border-border-base bg-background px-3.5 py-2.5 text-foreground placeholder:text-foreground-muted"
                placeholder="Mínimo de 8 caracteres"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground md:col-span-1">
              Confirmar senha *
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                className="rounded-xl border border-border-base bg-background px-3.5 py-2.5 text-foreground placeholder:text-foreground-muted"
                placeholder="Repita sua senha"
              />
            </label>

            <div className="md:col-span-2 rounded-2xl border border-border-base bg-background p-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-subtitle">
                Configurações iniciais
              </h2>

              <div className="mt-3 flex flex-col gap-3">
                <label className="flex items-start gap-3 rounded-xl border border-border-base p-3">
                  <input
                    type="checkbox"
                    checked={isPrivateProfile}
                    onChange={(e) => setIsPrivateProfile(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="flex flex-col">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <LockSimpleIcon size={16} weight="fill" />
                      Perfil privado
                    </span>
                    <span className="text-sm text-subtitle">
                      Somente pessoas aprovadas podem ver seus posts.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-border-base p-3">
                  <input
                    type="checkbox"
                    checked={receiveProductUpdates}
                    onChange={(e) => setReceiveProductUpdates(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="flex flex-col">
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <BellSimpleRingingIcon size={16} weight="fill" />
                      Receber novidades do produto
                    </span>
                    <span className="text-sm text-subtitle">
                      Envio de recursos novos e melhorias da plataforma.
                    </span>
                  </span>
                </label>

                <div className="rounded-xl border border-border-base p-3">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <PaletteIcon size={16} weight="fill" />
                    Aparência preferida
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["system", "light", "dark"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setThemePreference(option)}
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold capitalize transition-colors ${
                          themePreference === option
                            ? "border-background-brand bg-background-brand text-foreground-inverted"
                            : "border-border-base bg-background text-foreground hover:bg-background-raised"
                        }`}
                      >
                        {option === "system" ? "Sistema" : option === "light" ? "Claro" : "Escuro"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {message && (
              <p className="md:col-span-2 rounded-lg border border-border-base bg-background px-3 py-2 text-sm text-foreground">
                {message}
              </p>
            )}

            <div className="md:col-span-2 mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-subtitle">
                  * O preenchimento do campo é obrigatório.
                </p>
                <p className="text-sm text-subtitle">
                  Já tem conta?{" "}
                  <Link href="/login" className="font-semibold text-foreground-brand underline">
                    Fazer login
                  </Link>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 font-bold text-foreground-inverted gradient-to-l disabled:opacity-70"
              >
                {loading ? "Criando conta..." : "Criar conta"}
              </button>
            </div>
          </form>
        </section>

        <aside className="rounded-3xl border border-border-base bg-background-raised p-6 md:p-8 lg:sticky lg:top-6 lg:h-fit">
          <h2 className="text-lg font-black tracking-tight text-foreground">Prévia do perfil</h2>
          <p className="mt-1 text-sm text-subtitle">
            Veja como as suas escolhas iniciais aparecem para outras pessoas.
          </p>

          <div className="mt-5 rounded-2xl border border-border-base bg-background p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-full gradient-to-l text-xl font-black text-foreground-inverted">
                {(name.trim()[0] ?? "E").toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-foreground">{name.trim() || "Seu nome"}</p>
                <p className="text-sm text-subtitle">
                  @{username.trim().toLowerCase() || "seu.usuario"}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-foreground">
              {bio.trim() || "Sua bio vai aparecer aqui quando você preencher."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-background-raised px-3 py-1 text-xs font-semibold text-foreground">
                {isPrivateProfile ? "Perfil privado" : "Perfil público"}
              </span>
              <span className="rounded-full bg-background-raised px-3 py-1 text-xs font-semibold text-foreground">
                Tema: {themePreference === "system" ? "Sistema" : themePreference === "light" ? "Claro" : "Escuro"}
              </span>
              <span className="rounded-full bg-background-raised px-3 py-1 text-xs font-semibold text-foreground">
                {receiveProductUpdates ? "Novidades ativadas" : "Novidades desativadas"}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border-base bg-background p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <GlobeHemisphereWestIcon size={16} weight="fill" />
              Dica rápida
            </p>
            <p className="mt-1 text-sm text-subtitle">
              Você pode alterar todas essas preferências depois na página de
              configurações.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
