"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getAuthErrorMessage, validateNewPassword } from "@/lib/password";
import { RECOVERY_COOKIE } from "@/lib/recovery";

export type ResetPasswordResult =
  | { status: "ok" }
  | { status: "password_updated_logout_failed"; message: string }
  | { status: "error"; message: string };

// A troca só é aceita com o cookie emitido por /auth/confirm após validar o link de recuperação.
export async function resetPassword(
  password: string,
  confirmPassword: string,
): Promise<ResetPasswordResult> {
  const cookieStore = await cookies();

  if (!cookieStore.has(RECOVERY_COOKIE)) {
    return {
      status: "error",
      message: "Link de recuperação inválido ou expirado. Solicite um novo.",
    };
  }

  const validationError = validateNewPassword(password, confirmPassword);
  if (validationError) {
    return { status: "error", message: validationError };
  }

  const supabase = await createClient();

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    return { status: "error", message: getAuthErrorMessage(updateError.message) };
  }

  cookieStore.delete(RECOVERY_COOKIE);

  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    return {
      status: "password_updated_logout_failed",
      message:
        "Sua senha foi alterada, mas não foi possível encerrar a sessão. Tente sair novamente.",
    };
  }

  return { status: "ok" };
}
