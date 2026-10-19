import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Multipart overhead may exceed the 10 MB evidence-file limit slightly.
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
