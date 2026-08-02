import { ZgStorage } from "@0gfoundation/0g-storage-ts-sdk";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { ZodType } from "zod";

export interface UploadResult {
  merkleRoot: string;
  txHash: string;
  size: number;
}

export class OGStorageService {
  private zgStorage: ZgStorage;

  constructor() {
    this.zgStorage = new ZgStorage({
      providerUrl: process.env.ZG_STORAGE_PROVIDER_URL!,
      evmRpc: process.env.OG_RPC_URL || "https://evmrpc.0g.ai"
    });
  }

  /**
   * Encrypt JSON with AES-256-GCM
   */
  private encryptJson(obj: unknown, key: Buffer): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const ct = Buffer.concat([
      cipher.update(JSON.stringify(obj), "utf8"),
      cipher.final()
    ]);

    // Format: [IV(12) | AuthTag(16) | Ciphertext]
    return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
  }

  /**
   * Decrypt JSON with AES-256-GCM
   */
  private decryptJson<T>(payload: string, key: Buffer, schema: ZodType<T>): T {
    const buf = Buffer.from(payload, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ct = buf.subarray(28);

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    const plain = Buffer.concat([
      decipher.update(ct),
      decipher.final()
    ]).toString("utf8");

    return schema.parse(JSON.parse(plain));
  }

  /**
   * Upload encrypted data to 0G Storage
   */
  async uploadEncrypted(params: {
    data: unknown;
    key: Buffer;
    tags?: string[];
  }): Promise<{ ok: UploadResult } | { error: string }> {
    try {
      const encrypted = this.encryptJson(params.data, params.key);

      const result = await this.zgStorage.upload({
        data: Buffer.from(encrypted, "base64"),
        tags: params.tags || []
      });

      return {
        ok: {
          merkleRoot: result.merkleRoot,
          txHash: result.txHash,
          size: result.size
        }
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Upload failed"
      };
    }
  }

  /**
   * Download and decrypt data from 0G Storage
   */
  async downloadEncrypted<T>(params: {
    merkleRoot: string;
    key: Buffer;
    schema: ZodType<T>;
  }): Promise<{ ok: T } | { error: string }> {
    try {
      const blob = await this.zgStorage.download(params.merkleRoot);
      const encrypted = blob.toString("base64");
      const data = this.decryptJson(encrypted, params.key, params.schema);

      return { ok: data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Download failed"
      };
    }
  }

  /**
   * Compute Merkle root locally (for caching)
   */
  computeMerkleRoot(data: Buffer): string {
    // Simplified - real implementation would match 0G's algorithm
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(data).digest("hex");
  }
}
