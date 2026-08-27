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
  },
  // Configure headers for Privy auth and wallet connections
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "frame-ancestors 'self' https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org",
              "frame-src 'self' https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org",
              "connect-src 'self' https://auth.privy.io https://*.privy.io https://*.walletconnect.com https://*.walletconnect.org https://ethereum-sepolia-rpc.publicnode.com https://evmrpc-testnet.0g.ai wss://*.walletconnect.com wss://*.walletconnect.org"
            ].join('; ')
          }
        ]
      }
    ];
  }
};

export default nextConfig;
