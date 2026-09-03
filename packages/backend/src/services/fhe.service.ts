/**
 * Zama FHE Service for Backend
 *
 * Implements Fully Homomorphic Encryption using Zama's fhEVM
 * Pattern from Ghostlend and other production Zama integrations
 */

import { createFhevmInstance, FhevmInstance } from "@zama-fhe/sdk";
import { JsonRpcProvider } from "ethers";

export class FHEService {
  private fhevmInstance: FhevmInstance | null = null;
  private provider: JsonRpcProvider;
  private contractAddress: string;
  private publicKey: string | null = null;

  constructor() {
    const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
    this.contractAddress = process.env.MEDICAL_REGISTRY_ADDRESS || "0x2819Cf40a952748014C56f393e1ffd16f4a377ff";
    this.provider = new JsonRpcProvider(rpcUrl);

    console.log("[FHE] Initializing Zama FHE service...");
  }

  /**
   * Initialize fhEVM instance
   * Pattern from Ghostlend: lazy initialization on first use
   */
  async initialize(): Promise<void> {
    if (this.fhevmInstance) {
      return; // Already initialized
    }

    console.log("[FHE] Creating fhEVM instance...");
    console.log(`[FHE] Contract: ${this.contractAddress}`);

    try {
      // Create fhEVM instance (Zama SDK v3.3.0 pattern)
      this.fhevmInstance = await createFhevmInstance({
        chainId: 11155111, // Sepolia
        networkUrl: this.provider.connection.url,
        gatewayUrl: "https://gateway.zama.ai", // Zama's public gateway
      });

      console.log("[FHE] ✓ fhEVM instance created");

      // Get public key for this contract
      await this.refreshPublicKey();

      console.log("[FHE] ✓ Initialization complete");
    } catch (error: any) {
      console.error("[FHE] ✗ Initialization failed:", error.message);
      throw new Error(`Failed to initialize FHE: ${error.message}`);
    }
  }

  /**
   * Refresh public key from contract
   */
  async refreshPublicKey(): Promise<void> {
    if (!this.fhevmInstance) {
      throw new Error("fhEVM instance not initialized");
    }

    try {
      console.log("[FHE] Fetching public key from contract...");

      // Get public key for the contract
      const { publicKey, signature } = await this.fhevmInstance.getPublicKey({
        contractAddress: this.contractAddress,
        userAddress: this.contractAddress, // Use contract as user for backend encryption
      });

      this.publicKey = publicKey;

      console.log(`[FHE] ✓ Public key: ${publicKey.substring(0, 20)}...`);
    } catch (error: any) {
      console.error("[FHE] ✗ Failed to get public key:", error.message);
      throw error;
    }
  }

  /**
   * Encrypt a uint8 value (risk score 0-100)
   * Pattern from Ghostlend for health factors
   */
  async encryptUint8(value: number): Promise<{
    encrypted: Uint8Array;
    proof: Uint8Array;
  }> {
    if (!this.fhevmInstance || !this.publicKey) {
      await this.initialize();
    }

    if (!this.fhevmInstance || !this.publicKey) {
      throw new Error("FHE not properly initialized");
    }

    try {
      console.log(`[FHE] Encrypting uint8: ${value}`);

      // Encrypt the value using the instance's encrypt method
      const encrypted = this.fhevmInstance.encrypt8(value);

      console.log(`[FHE] ✓ Encrypted: ${encrypted.data.length} bytes`);

      return {
        encrypted: encrypted.data,
        proof: new Uint8Array(0), // Zama SDK v3 handles proof internally
      };
    } catch (error: any) {
      console.error("[FHE] ✗ Encryption failed:", error.message);
      throw error;
    }
  }

  /**
   * Encrypt a uint32 value (for larger numbers like timestamps)
   */
  async encryptUint32(value: number): Promise<{
    encrypted: Uint8Array;
    proof: Uint8Array;
  }> {
    if (!this.fhevmInstance || !this.publicKey) {
      await this.initialize();
    }

    if (!this.fhevmInstance || !this.publicKey) {
      throw new Error("FHE not properly initialized");
    }

    try {
      console.log(`[FHE] Encrypting uint32: ${value}`);

      const encrypted = this.fhevmInstance.encrypt32(value);

      console.log(`[FHE] ✓ Encrypted: ${encrypted.data.length} bytes`);

      return {
        encrypted: encrypted.data,
        proof: new Uint8Array(0),
      };
    } catch (error: any) {
      console.error("[FHE] ✗ Encryption failed:", error.message);
      throw error;
    }
  }

  /**
   * Encrypt a bytes value (for diagnosis text)
   */
  async encryptBytes(value: Uint8Array): Promise<{
    encrypted: Uint8Array;
    proof: Uint8Array;
  }> {
    if (!this.fhevmInstance || !this.publicKey) {
      await this.initialize();
    }

    if (!this.fhevmInstance || !this.publicKey) {
      throw new Error("FHE not properly initialized");
    }

    try {
      console.log(`[FHE] Encrypting bytes: ${value.length} bytes`);

      // For bytes, we encrypt each byte separately and concatenate
      // This is a simplified approach - production would use more efficient methods
      const encryptedBytes: Uint8Array[] = [];

      for (let i = 0; i < Math.min(value.length, 32); i++) {
        const encrypted = this.fhevmInstance.encrypt8(value[i]);
        encryptedBytes.push(encrypted.data);
      }

      const concatenated = new Uint8Array(
        encryptedBytes.reduce((acc, arr) => acc + arr.length, 0)
      );

      let offset = 0;
      for (const arr of encryptedBytes) {
        concatenated.set(arr, offset);
        offset += arr.length;
      }

      console.log(`[FHE] ✓ Encrypted: ${concatenated.length} bytes`);

      return {
        encrypted: concatenated,
        proof: new Uint8Array(0),
      };
    } catch (error: any) {
      console.error("[FHE] ✗ Encryption failed:", error.message);
      throw error;
    }
  }

  /**
   * Get the fhEVM instance (for advanced usage)
   */
  async getInstance(): Promise<FhevmInstance> {
    if (!this.fhevmInstance) {
      await this.initialize();
    }

    if (!this.fhevmInstance) {
      throw new Error("Failed to initialize fhEVM instance");
    }

    return this.fhevmInstance;
  }

  /**
   * Check if FHE is initialized and ready
   */
  isReady(): boolean {
    return this.fhevmInstance !== null && this.publicKey !== null;
  }
}
