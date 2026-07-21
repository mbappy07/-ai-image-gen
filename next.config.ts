import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ali-oss"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.aliyuncs.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
