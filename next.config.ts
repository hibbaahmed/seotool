import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable webpack filesystem cache in dev to avoid ENOENT pack.gz errors
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false as any;
    }
    return config;
  },
  // No rewrites needed - using Next.js API routes directly
};

export default nextConfig;