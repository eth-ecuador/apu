import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Force webpack instead of Turbopack for better dependency resolution
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };

    // Explicitly resolve @stripe packages to avoid module resolution issues
    config.resolve.alias = {
      ...config.resolve.alias,
      '@stripe/stripe-js': path.resolve(__dirname, 'node_modules/@stripe/stripe-js'),
      '@stripe/crypto': path.resolve(__dirname, 'node_modules/@stripe/crypto'),
    };

    return config;
  }
};

export default nextConfig;
