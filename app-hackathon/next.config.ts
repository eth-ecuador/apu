import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // FHE SDK/worker init is not double-invoke friendly in dev (from ghostlend pattern)
  reactStrictMode: false,

  // Required headers for @zama-fhe WASM to work in the browser
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },

  // Webpack configuration to handle WASM (asyncWebAssembly goes in experiments only)
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Ignore optional peer dependencies that are React Native specific
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };

    return config;
  },
};

export default nextConfig;
