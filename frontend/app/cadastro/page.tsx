"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function CadastroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw new Error(error.message);

      setMessage("Conta criada com sucesso. Você já pode fazer login.");
      router.replace("/login");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh w-full bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg border border-zinc-200 flex flex-col gap-5 text-zinc-900">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-wide">Criar conta</h1>
          <p className="text-zinc-600">Entre na comunidade Esprokurt.</p>
        </div>

        <form onSubmit={handleSignUp} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            E-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 bg-white text-zinc-900 placeholder:text-zinc-500"
              placeholder="email@example.com"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Senha
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              className="rounded-md border border-zinc-300 px-3 py-2 bg-white text-zinc-900 placeholder:text-zinc-500"
              placeholder="Mínimo de 8 caracteres"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Confirmar senha
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              className="rounded-md border border-zinc-300 px-3 py-2 bg-white text-zinc-900 placeholder:text-zinc-500"
              placeholder="Repita sua senha"
            />
          </label>

          {message && <p className="text-sm text-zinc-700">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg px-4 py-2 font-semibold gradient-to-l"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="text-sm">
          Já tem conta?{" "}
          <Link href="/login" className="underline text-blue-700">
            Fazer login
          </Link>
        </p>
      </div>
    </main>
  );
}
