import type { NextConfig } from "next";

const env = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};

// Define all your services here
const services = [
  {
    source: "/plat-form-core-service",
    destination: env.INTERNAL_PLATFORM_CORE_SERVICE_API_URL ?? "",
  }
];

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/message-service/medias/**",
      },
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