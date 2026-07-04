import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: "../",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "imgs.search.brave.com" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "mockmind-api.uifaces.co" },
    ],
  },
};

export default nextConfig;