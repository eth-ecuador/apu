"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { WagmiProvider, usePublicClient, useWalletClient, useAccount } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { ZamaProvider } from "@zama-fhe/react-sdk";
import { createConfig as createZamaConfig } from "@zama-fhe/sdk/viem";
import { sepolia as zamaSepolia } from "@zama-fhe/sdk/chains";
import { web } from "@zama-fhe/sdk/web";
import { createWalletClient, custom, http, type WalletClient } from "viem";
import { sepolia as viemSepolia } from "viem/chains";
import { config as wagmiConfig } from "./wagmi";
import "@rainbow-me/rainbowkit/styles.css";

const RPC = "https://ethereum-sepolia-rpc.publicnode.com";

/**
 * ZamaBridge - Builds the Zama SDK config from wagmi's viem clients
 * Pattern from ghostlend (mainnet-s3 winner):
 * - Rebuilds when wallet connects
 * - Read-only placeholder walletClient before connect
 * - Connector-derived signing client as fallback
 */
function ZamaBridge({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address, isConnected, connector } = useAccount();

  // Connector-derived signing client (reliable fallback when useWalletClient() lags)
  const [connectorWC, setConnectorWC] = useState<WalletClient | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isConnected || !address || !connector) {
        setConnectorWC(null);
        return;
      }
      try {
        const provider = (await connector.getProvider()) as any;
        if (cancelled || !provider) return;
        setConnectorWC(
          createWalletClient({
            account: address,
            chain: viemSepolia,
            transport: custom(provider),
          })
        );
      } catch (e) {
        console.error("[zama connector walletClient failed]", e);
        if (!cancelled) setConnectorWC(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isConnected, address, connector]);

  const config = useMemo(() => {
    if (!mounted || !publicClient) return null;

    try {
      // Prefer client with account; fallback to connector-derived; finally http reader
      const signer = (walletClient?.account ? walletClient : null) ?? connectorWC;
      const wc =
        signer ?? createWalletClient({ chain: viemSepolia, transport: http(RPC) });

      return createZamaConfig({
        chains: [zamaSepolia],
        relayers: { [zamaSepolia.id]: web() }, // Web relayer for KMS
        publicClient: publicClient as any,
        walletClient: wc as any,
      });
    } catch (e) {
      console.error("[zama config init failed]", e);
      return null;
    }
  }, [mounted, publicClient, walletClient, connectorWC]);

  // Wait for config to be ready before rendering children
  // This ensures ZamaProvider is available for all child components
  if (!config) return null;
  return <ZamaProvider config={config}>{children}</ZamaProvider>;
}

/**
 * Providers - Root provider tree
 * CRITICAL ORDER (ghostlend pattern):
 * 1. WagmiProvider (wallet connection)
 * 2. QueryClientProvider (TanStack Query - ABOVE ZamaProvider)
 * 3. RainbowKitProvider (wallet UI)
 * 4. ZamaProvider (FHE SDK)
 */
/**
 * Provider order is load-bearing (ghostlend pattern):
 * WagmiProvider → QueryClientProvider (ABOVE ZamaProvider) → RainbowKitProvider → ZamaProvider
 * The Zama react-sdk hooks run on TanStack Query, so QueryClient MUST wrap ZamaProvider.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  // Client-only provider tree (avoid SSR/prerender issues)
  // With `export const dynamic = "force-dynamic"` in layout, pages won't be prerendered.
  // We still gate on mount to ensure client-only rendering of wallet/FHE contexts.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null; // Don't render anything until client-side mount

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ZamaBridge>{children}</ZamaBridge>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
