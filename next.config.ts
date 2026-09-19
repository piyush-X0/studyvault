import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "@xenova/transformers", "onnxruntime-node", "sharp"],
  outputFileTracingIncludes: {
    "/*": ["./node_modules/**/onnxruntime-node/bin/napi-v3/linux/x64/*"],
  },
  devIndicators: false,
};

export default nextConfig;
