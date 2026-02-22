import type { NextConfig } from "next";

const isMobileBuild = process.env.CAPACITOR_BUILD === "1";

const nextConfig: NextConfig = {
  // Static export only for Capacitor native builds.
  // Vercel builds without CAPACITOR_BUILD so the API routes keep working.
  ...(isMobileBuild ? { output: "export" } : {}),
};

export default nextConfig;
