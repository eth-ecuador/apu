"use client";

import { useAccount, useChainId } from "wagmi";

export function NetworkStatus() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const getNetworkName = (id: number) => {
    switch (id) {
      case 11155111: return "Sepolia";
      case 16661: return "0G Mainnet";
      default: return "Unknown";
    }
  };

  const networks = [
    { name: "Ethereum Sepolia", chainId: 11155111, purpose: "FHE Encryption" },
    { name: "0G Network", chainId: 16661, purpose: "Storage + AI" }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Network Status</h3>

      <div className="space-y-3">
        {networks.map((network) => (
          <div key={network.chainId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-medium text-sm">{network.name}</div>
                <div className="text-xs text-gray-500">{network.purpose}</div>
              </div>
            </div>
            {isConnected && chainId === network.chainId && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                Connected
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
        <p>Dual-network architecture ensures privacy and performance</p>
      </div>
    </div>
  );
}
