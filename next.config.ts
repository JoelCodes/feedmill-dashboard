import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // nuqs is ESM-only; transpile it for Jest test compatibility
  transpilePackages: ['nuqs'],
};

export default nextConfig;
