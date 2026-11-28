import { communityHref } from "@/lib/communities";
import { redirect } from "next/navigation";

// Links antigos (/communities/<slug>) levam à página nova.
export default async function LegacyCommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(communityHref(decodeURIComponent(slug)));
}
