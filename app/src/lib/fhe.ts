import { createFheClient } from "@zama-fhe/react-sdk";

// FHE Client configuration for Sepolia
export const fheConfig = {
  networkUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
  gatewayUrl: process.env.NEXT_PUBLIC_KMS_GATEWAY_URL || "https://gateway.sepolia.zama.dev",
  chainId: 11155111
};

// Initialize FHE client
export const fheClient = createFheClient(fheConfig);

/**
 * Encrypt a number with FHE (client-side)
 */
export async function encryptNumber(value: number): Promise<{
  encrypted: Uint8Array;
  proof: Uint8Array;
}> {
  await fheClient.init();

  const encrypted = await fheClient.encrypt({
    value,
    type: "uint32"
  });

  return {
    encrypted: encrypted.data,
    proof: encrypted.proof
  };
}

/**
 * Request decryption from KMS Gateway (authorized only)
 */
export async function requestDecryption(params: {
  contractAddress: string;
  encryptedValue: string;
  signature: string;
}): Promise<number> {
  await fheClient.init();

  const decrypted = await fheClient.decrypt({
    contractAddress: params.contractAddress,
    encryptedValue: params.encryptedValue,
    signature: params.signature
  });

  return decrypted;
}

/**
 * Derive AES key from wallet signature (HKDF)
 */
export async function deriveEncryptionKey(signature: string): Promise<Buffer> {
  // In production, use @noble/hashes/hkdf
  const encoder = new TextEncoder();
  const data = encoder.encode(signature);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(hashBuffer);
}
