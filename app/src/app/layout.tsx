import type { Metadata } from "next";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "../lib/wagmi";
import "./globals.css";

const queryClient = new QueryClient();

export const metadata: Metadata = {
  title: "APU - Confidential Medical AI",
  description: "Privacy-preserving AI medical diagnosis with Zama FHE, 0G Storage & TEE Compute",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
          config={{
            loginMethods: ["email", "wallet"],
            appearance: {
              theme: "dark",
              accentColor: "#06b6d4"
            }
          }}
        >
          <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          </WagmiProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
