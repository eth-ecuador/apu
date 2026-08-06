/**
 * Zama FHE SDK configuration
 *
 * Pattern from ghostlend (mainnet-s3 winner):
 * - ZamaProvider wraps the app with dynamic config
 * - Config is created in layout.tsx using wagmi clients
 * - useEncrypt hook returns TanStack Query mutation
 *
 * Note: The actual config is created in layout.tsx using wagmi's
 * publicClient and walletClient. This file only exports the helper.
 */

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
