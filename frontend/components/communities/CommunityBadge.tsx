import { BADGE_LABEL, type CommunityBadgeKind } from "@/lib/communities";

export function CommunityBadge({ kind }: { kind: CommunityBadgeKind }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border-base bg-background-raised px-2 py-0.5 text-xs font-bold text-foreground-brand">
      {BADGE_LABEL[kind]}
    </span>
  );
}
