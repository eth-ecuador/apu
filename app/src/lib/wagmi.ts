import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";

// 0G Mainnet chain configuration
const ogMainnet = {
  id: 16661,
  name: "0G Mainnet",
  nativeCurrency: {
    name: "0G",
    symbol: "0G",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ["https://evmrpc.0g.ai"]
    }
  },
  blockExplorers: {
    default: {
      name: "0G Chain Scan",
      url: "https://chainscan.0g.ai"
    }
  }
} as const;

export const wagmiConfig = createConfig({
  chains: [sepolia, ogMainnet],
  transports: {
    [sepolia.id]: http(),
    [ogMainnet.id]: http()
  }
});
