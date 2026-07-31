/**
 * Contract addresses and configuration
 * Pattern from ghostlend mainnet-s3 winner
 */

// Contract addresses (UPDATE after deployment to Sepolia)
export const ADDR = {
  healthDataAggregator: "0x780c06f807E5fB8768A0cD6648A28D8A621F0470", // Deployed to Sepolia (legacy)
  medicalRecordsV2: "0x5B30F890A70933D936De2d45e7DC15191c0aA0a5",       // Production-grade medical records with ACL (patient-doctor authorization)
} as const;

// Permit contracts (for useGrantPermit hook)
export const PERMIT_CONTRACTS = [
  ADDR.healthDataAggregator,
  ADDR.medicalRecordsV2,
] as const;

// Network configuration
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
export const ZAMA_GATEWAY_URL = "https://gateway.sepolia.zama.ai";
