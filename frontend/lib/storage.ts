import type { createClient } from "@/lib/supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;

// Avatar e capa ficam em `<bucket>/<id do usuário>/<arquivo>`.
export const PROFILE_IMAGE_BUCKETS = ["avatars", "headers"] as const;

/**
 * Apaga os arquivos da pasta do usuário num bucket, menos `keepPath`.
 *
 * Usado ao trocar a foto (para a antiga não continuar pública pela URL) e ao
 * excluir a conta (LGPD: os dados pessoais saem junto com a conta).
 */
export async function removeUserFiles(
  supabase: SupabaseClient,
  bucket: string,
  userId: string,
  keepPath?: string,
) {
  const { data, error } = await supabase.storage.from(bucket).list(userId, { limit: 1000 });
  if (error) throw new Error(error.message);

  const paths = (data ?? [])
    .map((file) => `${userId}/${file.name}`)
    .filter((path) => path !== keepPath);
  if (paths.length === 0) return;

  const { error: removeError } = await supabase.storage.from(bucket).remove(paths);
  if (removeError) throw new Error(removeError.message);
}
