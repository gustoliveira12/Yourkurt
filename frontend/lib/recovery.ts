import type { JwtPayload } from "@supabase/supabase-js";

export const RECOVERY_PATH = "/redefinir-senha";
export const RECOVERY_MAX_AGE_SECONDS = 10 * 60;

// Só uma sessão criada pelo link de recuperação traz o método "recovery" no
// claim amr, assinado pelo Supabase. O timestamp limita a validade da prova.
export function isFreshRecoverySession(
  claims: JwtPayload | null | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  const amr = claims?.amr;
  if (!Array.isArray(amr)) return false;

  return amr.some((entry) => {
    if (typeof entry === "string") return false;
    return (
      entry.method === "recovery" &&
      typeof entry.timestamp === "number" &&
      nowSeconds - entry.timestamp <= RECOVERY_MAX_AGE_SECONDS
    );
  });
}
