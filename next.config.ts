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
};

export default nextConfig;
