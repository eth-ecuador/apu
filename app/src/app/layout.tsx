import type { Metadata } from "next";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "../lib/wagmi";
import "./globals.css";

const queryClient = new QueryClient();

export const metadata: Metadata = {
  title: "APU - Medical AI Diagnosis",
  description: "Privacy-preserving AI medical diagnosis with FHE and decentralized computing",
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
            loginMethods: ["email", "google"],
            embeddedWallets: {
              createOnLogin: "all-users",
              showWalletLoginFirst: false
            },
            appearance: {
              theme: "light",
              accentColor: "#3B82F6"
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
