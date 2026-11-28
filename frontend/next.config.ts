import type { NextConfig } from "next";

// Libera o next/image só para os arquivos públicos do Storage do projeto
// Supabase configurado no .env.
const supabaseHostname = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  turbopack: {
    root: "../",
  },
  images: {
    qualities: [75, 90, 100],
    // O otimizador recusa hosts em IP privado (127.0.0.1 do Storage local);
    // liberado só fora de produção, para o dev com Supabase local.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: [
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      // Storage do Supabase local (npx supabase start), só em http.
      {
        protocol: "http" as const,
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
