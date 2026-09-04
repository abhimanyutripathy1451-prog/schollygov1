import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/app/:path*",
        destination: "http://localhost:3001/app/:path*",
      },
    ];
  },
};

export default nextConfig;
