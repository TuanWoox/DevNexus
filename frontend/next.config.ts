import type { NextConfig } from "next";

const env = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};

// Define all your services here
const services = [
  {
    source: "/plat-form-core-service",
    destination: env.INTERNAL_PLATFORM_CORE_SERVICE_API_URL ?? "",
  },
  {
    source: "/message-service",
    destination: env.INTERNAL_MESSAGE_SERVICE_API_URL ?? "",
  },
  {
    source: "/notification-service",
    destination: env.INTERNAL_NOTIFICATION_SERVICE_API_URL ?? "",
  }
];

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/message-service/medias/**",
      },
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
      // TODO: Before production, replace this with your actual backend / CDN hostname(s).
      // Example: { protocol: 'https', hostname: 'api.devnexus.io' }
      // Wildcard ('**') is intentionally NOT used here to prevent SSRF-style fetches
      // from attacker-controlled URLs stored in user-controlled fields (e.g. avatarUrl).
    ],
  },
  async rewrites() {
    return services.map(({ source, destination }) => ({
      source: `${source}/:path*`,
      destination: `${destination}/:path*`,
    }));
  },
};

export default nextConfig;
