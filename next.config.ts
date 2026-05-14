import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // nuqs is ESM-only; transpile it for Jest test compatibility
  transpilePackages: ['nuqs'],
  // read-excel-file → unzipper has a conditional require('@aws-sdk/client-s3') for its
  // S3 loader. We only parse Buffers, so that branch never runs, but Turbopack's static
  // graph still attempts resolution. Defer to Node so the unused branch is skipped.
  serverExternalPackages: ['unzipper', 'read-excel-file'],
};

export default nextConfig;
