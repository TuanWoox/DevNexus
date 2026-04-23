import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Local development API (HTTP)
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      // Local development API (HTTPS)
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      // Production: allow any HTTPS origin for avatar URLs served by the backend or CDN.
      // Narrow this down to specific hostnames once the production domain is known.
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
