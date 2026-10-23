"use client";

import { useParams } from "next/navigation";

export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Comunidade: {slug}</h1>
    </main>
  );
}
