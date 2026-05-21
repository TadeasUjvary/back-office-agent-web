import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse loads test fixtures via fs at import time → keep it external (server-only)
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
