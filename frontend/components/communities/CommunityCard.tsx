import { Avatar } from "@/components/Avatar";
import { communityHref, themeLabel, type Community } from "@/lib/communities";
import Link from "next/link";

export function CommunityCard({ community, isMember }: { community: Community; isMember: boolean }) {
  const members = `${community.members_count} ${community.members_count === 1 ? "membro" : "membros"}`;
  return (
    <Link
      href={communityHref(community.slug)}
      className="flex gap-3 rounded-card border border-border-base bg-surface p-4 hover:bg-background-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground-brand"
    >
      {community.avatar_url ? (
        <Avatar src={community.avatar_url} name={community.name} decorative />
      ) : (
        <span
          aria-hidden="true"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground-muted text-lg font-bold text-foreground-inverted"
        >
          {community.name.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate font-bold text-foreground">{community.name}</h2>
          {isMember && (
            <span className="rounded-full border border-border-base bg-background-raised px-2 py-0.5 text-xs font-bold text-foreground-brand">
              Membro
            </span>
          )}
        </div>
        <p className="text-sm text-subtitle">
          c/{community.slug} · {themeLabel(community.theme)} · {members}
        </p>
        {community.description && (
          <p className="mt-1 line-clamp-2 text-sm text-foreground">{community.description}</p>
        )}
      </div>
    </Link>
  );
}
