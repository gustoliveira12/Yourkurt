"use client";
import CreatePostbox from "./CreatePostbox";
import { useCurrentProfile } from "@/lib/hooks/useCurrentProfile";
import type { Post } from "@/lib/hooks/usePosts";

type PostComposerProps = {
  onPostCreated?: (post: Post) => void;
  /** Classes do contêiner; controla em que telas a caixa aparece. */
  className?: string;
};

// Caixa de novo post com o perfil do usuário logado.
export default function RightNavbar({ onPostCreated, className = "flex" }: PostComposerProps) {
  const { profile } = useCurrentProfile();

  const handlePostCreated = (post: Post) => {
    if (onPostCreated) {
      onPostCreated(post);
    }
  };

  return (
    <div className={`${className} flex-col gap-8 max-w-136`}>
      {profile && (
        <CreatePostbox
          avatarUrl={profile.avatarUrl}
          userId={profile.id}
          profile={{
            name: profile.name,
            username: profile.username,
            avatar_url: profile.avatarUrl,
          }}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
}
