import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    //TODO: TIRAR BRAVE DAQUI
    remotePatterns: [{ protocol: "https", hostname: "imgs.search.brave.com" }],
  },
};

export default nextConfig;
