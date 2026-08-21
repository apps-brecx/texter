import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp ships native binaries — it has to stay outside the server bundle.
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
