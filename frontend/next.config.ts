import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  turbopack: {
    root: "../",
  },
  images: {
    qualities: [75, 90, 100],
    remotePatterns: [
      { protocol: "https", hostname: "imgs.search.brave.com" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "mockmind-api.uifaces.co" },
      ...(supabaseHostname
        ? [{ protocol: "https" as const, hostname: supabaseHostname }]
        : []),
    ],
  },
};

export default nextConfig;