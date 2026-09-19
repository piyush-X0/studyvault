import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', "@xenova/transformers", 'mammoth'],
  devIndicators: false,
};

export default nextConfig;
