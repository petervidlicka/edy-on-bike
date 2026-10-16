import type { NextConfig } from "next";

const isMobileBuild = process.env.CAPACITOR_BUILD === "1";

const nextConfig: NextConfig = {
  // Static export only for Capacitor native builds.
  // Vercel builds without CAPACITOR_BUILD so the API routes keep working.
  ...(isMobileBuild ? { output: "export" } : {}),
  // Server-only route handlers are named `route.web.ts`. A static export can't
  // contain them (the native app calls the hosted API via NEXT_PUBLIC_API_URL),
  // so only the web build picks up the `web.ts` extension.
  pageExtensions: isMobileBuild ? ["tsx", "ts"] : ["web.ts", "tsx", "ts"],
  experimental: {
    // Next 16.4 enables Turbopack's persistent build cache by default. On
    // Vercel it read the restored cache from a Next 16.1 build and failed to
    // resolve next/font/google files. Every branch falls back to that stale
    // production cache until a 16.4 build replaces it, so it stays off for now.
    // TODO: re-enable once production has deployed (and cached) on Next 16.4+,
    // or after one "Redeploy without build cache" of main.
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
