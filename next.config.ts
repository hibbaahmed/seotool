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
  // API proxy configuration - forward API requests to Express server
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5174/api/:path*',
      },
    ];
  },
};

export default nextConfig;