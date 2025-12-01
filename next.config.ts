import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.wordpress.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.wp.com',
        pathname: '/**',
      },
      {
        protocol: "https",
        hostname: "replicate.com",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
      },
      {
        protocol: "https",
        hostname: "*.replicate.delivery",
      },
    ],
  },
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