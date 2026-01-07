import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Ignore TypeScript errors during build (for hackathon speed)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
