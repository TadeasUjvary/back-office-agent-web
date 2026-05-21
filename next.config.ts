import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // unpdf is server-only for PDF text extraction
  serverExternalPackages: ["unpdf"],
};

export default nextConfig;
