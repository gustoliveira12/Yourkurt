"use client";
import { LucideIcon } from "lucide-react";
import type { UrlObject } from "url";
import CreatePostbox from "./CreatePostbox";
import { useCurrentProfile } from "@/lib/hooks/useCurrentProfile";
import type { Post } from "@/lib/hooks/usePosts";

interface CommunityItems {
  text: string;
  redirect: UrlObject | string;
  icon: LucideIcon;
  color: string;
}

type NavlinkProps = {
  prop: CommunityItems[];
  onPostCreated?: (post: Post) => void;
};

export default function RightNavbar({ prop, onPostCreated }: NavlinkProps) {
  void prop;
  const { profile } = useCurrentProfile();

  const handlePostCreated = (post: Post) => {
    if (onPostCreated) {
      onPostCreated(post);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-136">
      {profile && (
        profile.isAdmin ? (
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
        ) : (
          <div className="hidden sm:flex w-full max-w-lg rounded-lg border border-border-base bg-background-raised px-4 py-3 text-sm text-subtitle">
            Apenas administradores podem publicar no momento.
          </div>
        )
      )}
    </div>
  );
}
