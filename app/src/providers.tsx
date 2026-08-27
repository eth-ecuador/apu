"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, usePublicClient, useWalletClient } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ZamaProvider } from "@zama-fhe/react-sdk";
import { createConfig as createZamaConfig } from "@zama-fhe/sdk/viem";
import { sepolia as zamaSepolia } from "@zama-fhe/sdk/chains";
import { web } from "@zama-fhe/sdk/web";
import { createWalletClient, http } from "viem";
import { sepolia as viemSepolia } from "viem/chains";
import { wagmiConfig } from "./lib/wagmi";

const RPC = "https://ethereum-sepolia-rpc.publicnode.com";

/**
 * Zama Bridge - creates Zama SDK config from wagmi clients
 * Pattern from ghostlend (mainnet-s3 winner)
 */
function ZamaBridge({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const config = useMemo(() => {
    if (!mounted || !publicClient) return null;
    try {
      // Use wallet client if available, otherwise fallback to read-only
      const wc = walletClient?.account
        ? walletClient
        : createWalletClient({ chain: viemSepolia, transport: http(RPC) });

      return createZamaConfig({
        chains: [zamaSepolia],
        relayers: { [zamaSepolia.id]: web() },
        publicClient: publicClient as any,
        walletClient: wc as any,
      });
    } catch (e) {
      console.error("[zama config init failed]", e);
      return null;
    }
  }, [mounted, publicClient, walletClient]);

  if (!config) return <>{children}</>;
  return <ZamaProvider config={config}>{children}</ZamaProvider>;
}

/**
 * Main providers wrapper
 * Provider order: Privy → Wagmi → QueryClient → Zama
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <>{children}</>;

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#14B8A6",
          logo: "https://apu-frontend.onrender.com/logo.png"
        },
        // Default chain
        defaultChain: viemSepolia,
        // Support Sepolia
        supportedChains: [viemSepolia]
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <ZamaBridge>{children}</ZamaBridge>
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
}
