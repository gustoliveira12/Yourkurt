"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthErrorMessage, validateNewPassword } from "@/lib/password";
import { isFreshRecoverySession } from "@/lib/recovery";

export type ResetPasswordResult =
  | { status: "ok" }
  | { status: "password_updated_logout_failed"; message: string }
  | { status: "error"; message: string };

// A troca só é aceita para uma sessão recém-criada pelo link de recuperação (claim amr assinado).
export async function resetPassword(
  password: string,
  confirmPassword: string,
): Promise<ResetPasswordResult> {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  if (!isFreshRecoverySession(claimsData?.claims)) {
    return {
      status: "error",
      message: "Link de recuperação inválido ou expirado. Solicite um novo.",
    };
  }

  const validationError = validateNewPassword(password, confirmPassword);
  if (validationError) {
    return { status: "error", message: validationError };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    return { status: "error", message: getAuthErrorMessage(updateError.message) };
  }

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
