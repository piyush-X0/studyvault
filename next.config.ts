import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@xenova/transformers", "onnxruntime-node", "sharp", "@napi-rs/canvas"],
  outputFileTracingIncludes: {
    "/*": ["./node_modules/**/onnxruntime-node/bin/napi-v3/linux/x64/*",
      "./node_modules/@napi-rs/**/*"
    ],
  },
  devIndicators: false,
};

export default nextConfig;
