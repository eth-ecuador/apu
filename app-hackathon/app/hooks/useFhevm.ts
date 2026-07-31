"use client";

import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, JsonRpcSigner, Contract } from "ethers";
import { initFhevm, createInstance, FhevmInstance } from "fhevmjs";

// Sepolia network configuration
const SEPOLIA_CHAIN_ID = 11155111;

// Contract addresses (will be updated after deployment)
const HEALTH_DATA_AGGREGATOR_ADDRESS = "0x0000000000000000000000000000000000000000"; // UPDATE AFTER DEPLOYMENT

// Minimal ABI for HealthDataAggregator
const HEALTH_DATA_AGGREGATOR_ABI = [
  "function submitHealthData(bytes32 encryptedRiskScore, bytes calldata inputProof) external",
  "function requestAggregateDecryption() external returns (uint256 requestId)",
  "function authorizeResearcher(address researcher) external",
  "function submissionCount() external view returns (uint256)",
  "function hasPatientSubmitted(address patient) external view returns (bool)",
  "function getSubmissionCount() external view returns (uint256)",
  "function hasPatientSubmitted(address patient) external view returns (bool)",
  "function authorizedResearcher() external view returns (address)",
  "function owner() external view returns (address)",
  "event HealthDataSubmitted(address indexed patient, uint256 timestamp)",
  "event AggregateDecrypted(uint256 indexed requestId, uint32 aggregateSum, uint256 count)",
  "event AggregateDecryptionRequested(uint256 requestId, address indexed requester)",
];

export interface UseFhevmReturn {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  fhevmInstance: FhevmInstance | null;
  account: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  encryptAndSubmitHealthData: (riskScore: number) => Promise<void>;
  requestAggregateDecryption: () => Promise<void>;
  getSubmissionCount: () => Promise<number>;
  hasSubmitted: (address: string) => Promise<boolean>;
  getAuthorizedResearcher: () => Promise<string>;
  listenForAggregateDecryption: (callback: (requestId: bigint, sum: number, count: number) => void) => () => void;
}

export function useFhevm(): UseFhevmReturn {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [fhevmInstance, setFhevmInstance] = useState<FhevmInstance | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize fhevmjs on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initFhevm();
        console.log("fhevmjs initialized successfully");
      } catch (err) {
        console.error("Failed to initialize fhevmjs:", err);
        setError("Failed to initialize FHE encryption library");
      }
    };
    init();
  }, []);

  // Connect wallet function
  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed");
      }

      // Request account access
      const ethereum = window.ethereum;
      await ethereum.request({ method: "eth_requestAccounts" });

      // Create provider and signer
      const web3Provider = new BrowserProvider(ethereum);
      const web3Signer = await web3Provider.getSigner();
      const userAddress = await web3Signer.getAddress();

      // Check if on Sepolia
      const network = await web3Provider.getNetwork();
      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        throw new Error("Please switch to Sepolia testnet");
      }

      // Create FHE instance
      const instance = await createInstance({
        chainId: SEPOLIA_CHAIN_ID,
        networkUrl: `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY || ""}`,
        gatewayUrl: "https://gateway.sepolia.zama.ai",
      });

      setProvider(web3Provider);
      setSigner(web3Signer);
      setFhevmInstance(instance);
      setAccount(userAddress);
      setIsConnected(true);

      console.log("Wallet connected:", userAddress);
    } catch (err: any) {
      console.error("Failed to connect wallet:", err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Disconnect wallet function
  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setFhevmInstance(null);
    setAccount(null);
    setIsConnected(false);
    setError(null);
  }, []);

  // Encrypt and submit health data
  const encryptAndSubmitHealthData = useCallback(
    async (riskScore: number) => {
      if (!signer || !fhevmInstance) {
        throw new Error("Wallet not connected or FHE instance not initialized");
      }

      if (riskScore < 0 || riskScore > 100) {
        throw new Error("Risk score must be between 0 and 100");
      }

      setIsLoading(true);
      setError(null);

      try {
        // Create contract instance
        const contract = new Contract(HEALTH_DATA_AGGREGATOR_ADDRESS, HEALTH_DATA_AGGREGATOR_ABI, signer);

        // Check if already submitted
        const hasAlreadySubmitted = await contract.hasPatientSubmitted(account!);
        if (hasAlreadySubmitted) {
          throw new Error("You have already submitted data");
        }

        // Encrypt the risk score using fhevmjs
        const input = fhevmInstance.createEncryptedInput(HEALTH_DATA_AGGREGATOR_ADDRESS, account!);
        input.add32(riskScore); // euint32 encryption
        const encryptedInput = await input.encrypt();

        // Submit to contract
        console.log("Submitting encrypted health data...");
        const tx = await contract["submitHealthData(bytes32,bytes)"](
          encryptedInput.handles[0],
          encryptedInput.inputProof
        );

        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt.hash);

        return receipt;
      } catch (err: any) {
        console.error("Failed to submit health data:", err);
        setError(err.message || "Failed to submit health data");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [signer, fhevmInstance, account]
  );

  // Request aggregate decryption (researcher only)
  const requestAggregateDecryption = useCallback(async () => {
    if (!signer) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    setError(null);

    try {
      const contract = new Contract(HEALTH_DATA_AGGREGATOR_ADDRESS, HEALTH_DATA_AGGREGATOR_ABI, signer);

      // Check if user is authorized researcher
      const authorizedResearcher = await contract.authorizedResearcher();
      if (authorizedResearcher.toLowerCase() !== account!.toLowerCase()) {
        throw new Error("Only authorized researcher can request aggregate decryption");
      }

      console.log("Requesting aggregate decryption...");
      const tx = await contract.requestAggregateDecryption();

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Decryption requested:", receipt.hash);

      return receipt;
    } catch (err: any) {
      console.error("Failed to request decryption:", err);
      setError(err.message || "Failed to request aggregate decryption");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [signer, account]);

  // Get submission count
  const getSubmissionCount = useCallback(async (): Promise<number> => {
    if (!provider) {
      throw new Error("Provider not initialized");
    }

    try {
      const contract = new Contract(HEALTH_DATA_AGGREGATOR_ADDRESS, HEALTH_DATA_AGGREGATOR_ABI, provider);
      const count = await contract.getSubmissionCount();
      return Number(count);
    } catch (err: any) {
      console.error("Failed to get submission count:", err);
      throw err;
    }
  }, [provider]);

  // Check if address has submitted
  const hasSubmitted = useCallback(
    async (address: string): Promise<boolean> => {
      if (!provider) {
        throw new Error("Provider not initialized");
      }

      try {
        const contract = new Contract(HEALTH_DATA_AGGREGATOR_ADDRESS, HEALTH_DATA_AGGREGATOR_ABI, provider);
        return await contract.hasPatientSubmitted(address);
      } catch (err: any) {
        console.error("Failed to check submission status:", err);
        throw err;
      }
    },
    [provider]
  );

  // Get authorized researcher
  const getAuthorizedResearcher = useCallback(async (): Promise<string> => {
    if (!provider) {
      throw new Error("Provider not initialized");
    }

    try {
      const contract = new Contract(HEALTH_DATA_AGGREGATOR_ADDRESS, HEALTH_DATA_AGGREGATOR_ABI, provider);
      return await contract.authorizedResearcher();
    } catch (err: any) {
      console.error("Failed to get authorized researcher:", err);
      throw err;
    }
  }, [provider]);

  // Listen for AggregateDecrypted event
  const listenForAggregateDecryption = useCallback(
    (callback: (requestId: bigint, sum: number, count: number) => void) => {
      if (!provider) {
        throw new Error("Provider not initialized");
      }

      const contract = new Contract(HEALTH_DATA_AGGREGATOR_ADDRESS, HEALTH_DATA_AGGREGATOR_ABI, provider);

      // Event listener
      const listener = (requestId: bigint, aggregateSum: bigint, count: bigint) => {
        console.log("AggregateDecrypted event received:", {
          requestId: requestId.toString(),
          aggregateSum: Number(aggregateSum),
          count: Number(count),
        });
        callback(requestId, Number(aggregateSum), Number(count));
      };

      contract.on("AggregateDecrypted", listener);

      // Return cleanup function
      return () => {
        contract.off("AggregateDecrypted", listener);
      };
    },
    [provider]
  );

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      };

      const handleChainChanged = () => {
        // Reload page on chain change
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [disconnectWallet]);

  return {
    provider,
    signer,
    fhevmInstance,
    account,
    isConnected,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    encryptAndSubmitHealthData,
    requestAggregateDecryption,
    getSubmissionCount,
    hasSubmitted,
    getAuthorizedResearcher,
    listenForAggregateDecryption,
  };
}
