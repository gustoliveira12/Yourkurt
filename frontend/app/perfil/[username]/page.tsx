import { profileHref } from "@/lib/profile";
import { redirect } from "next/navigation";

// Links antigos (/perfil/<username>) levam à página nova (/u/<username>).
export default async function LegacyProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  redirect(profileHref(decodeURIComponent(username)) ?? "/perfil");
}
