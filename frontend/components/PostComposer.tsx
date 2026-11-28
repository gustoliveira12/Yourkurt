"use client";
import CreatePostbox from "./CreatePostbox";
import { useCurrentProfile } from "@/lib/hooks/useCurrentProfile";
import type { Post } from "@/lib/hooks/usePosts";

type PostComposerProps = {
  onPostCreated?: (post: Post) => void;
  /** Classes do contêiner; controla em que telas a caixa aparece. */
  className?: string;
  /** Publica na comunidade em vez do perfil/equipe. */
  community?: { id: string; name: string; slug: string };
  /** Ocupa a largura toda do contêiner em vez do máximo fixo do feed. */
  fullWidth?: boolean;
};

// Caixa de novo post com o perfil do usuário logado.
export default function RightNavbar({ onPostCreated, className = "flex", community, fullWidth }: PostComposerProps) {
  const { profile } = useCurrentProfile();

  const handlePostCreated = (post: Post) => {
    if (onPostCreated) {
      onPostCreated(post);
    }
  };

  return (
    <div className={`${className} flex-col gap-8 ${fullWidth ? "w-full" : "max-w-136"}`}>
      {profile && (
        <CreatePostbox
          avatarUrl={profile.avatarUrl}
          userId={profile.id}
          profile={{
            name: profile.name,
            username: profile.username,
            avatar_url: profile.avatarUrl,
            is_test_account: profile.isTestAccount,
          }}
          onPostCreated={handlePostCreated}
          community={community}
          fullWidth={fullWidth}
        />
      )}
    </div>
  );
}
