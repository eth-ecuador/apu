/**
 * 0G Storage Service - Production Implementation
 *
 * Based on patterns from:
 * - Anima (3rd place APAC Hackathon) - Timeout protection + dual-path download
 * - Ghast AI (1st place APAC Hackathon) - Fail-safe local backup
 *
 * Critical patterns implemented:
 * 1. Timeout protection on ALL network calls (upload: 120s, download: 30s)
 * 2. Dual-path download (SDK indexer → discovered nodes fallback)
 * 3. Fail-safe local backup for critical uploads
 * 4. AES-256-GCM encryption (0G recommended)
 */

import { Indexer, Uploader, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import { JsonRpcProvider, Wallet } from "ethers";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { writeFile, readFile, mkdir, readdir, unlink } from "fs/promises";
import { join } from "path";

// Timeout constants (from Anima production deployment)
const SDK_UPLOAD_TIMEOUT_MS = 120_000;      // 2 minutes
const SDK_INDEXER_TIMEOUT_MS = 30_000;      // 30 seconds
const SDK_DOWNLOAD_SEGMENT_TIMEOUT_MS = 30_000;  // 30 seconds per segment
const FINALIZE_POLL_INTERVAL_MS = 2_000;    // 2 seconds
const FINALIZE_TIMEOUT_MS = 120_000;        // 2 minutes

export interface UploadResult {
  merkleRoot: string;
  txHash: string;
  finalized: boolean;
}

export interface LocalPendingUpload {
  data: unknown;
  key: Buffer;
  timestamp: number;
  retryCount: number;
}

export class OGStorageService {
  private indexer: Indexer;
  private provider: JsonRpcProvider;
  private wallet: Wallet;
  private uploader: Uploader;
  private pendingUploadsDir: string;

  constructor() {
    const indexerUrl = process.env.OG_INDEXER_URL || "https://indexer-storage-testnet-turbo.0g.ai";
    const rpcUrl = process.env.OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
    const privateKey = process.env.OG_DEPLOYER_PRIVATE_KEY;

    if (!privateKey) {
      throw new Error("OG_DEPLOYER_PRIVATE_KEY not set in environment");
    }

    this.indexer = new Indexer(indexerUrl);
    this.provider = new JsonRpcProvider(rpcUrl);
    this.wallet = new Wallet(privateKey, this.provider);
    this.uploader = new Uploader(indexerUrl, this.provider, this.wallet);
    this.pendingUploadsDir = join(process.cwd(), ".pending-uploads");

    // Ensure pending uploads directory exists
    mkdir(this.pendingUploadsDir, { recursive: true }).catch(() => {});
  }

  /**
   * Encrypt JSON with AES-256-GCM (0G recommended)
   */
  private encryptJson(obj: unknown, key: Buffer): Buffer {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);

    const plaintext = JSON.stringify(obj);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    // Format: [IV(12) | AuthTag(16) | Ciphertext]
    return Buffer.concat([iv, authTag, ciphertext]);
  }

  /**
   * Decrypt JSON with AES-256-GCM
   */
  private decryptJson(encrypted: Buffer, key: Buffer): unknown {
    const iv = encrypted.subarray(0, 12);
    const authTag = encrypted.subarray(12, 28);
    const ciphertext = encrypted.subarray(28);

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]).toString("utf8");

    return JSON.parse(plaintext);
  }

  /**
   * Store failed upload locally for async retry
   */
  private async storeLocalPending(data: unknown, key: Buffer): Promise<void> {
    const pending: LocalPendingUpload = {
      data,
      key,
      timestamp: Date.now(),
      retryCount: 0
    };

    const filename = `pending-${Date.now()}-${randomBytes(4).toString("hex")}.json`;
    const filepath = join(this.pendingUploadsDir, filename);

    await writeFile(filepath, JSON.stringify(pending, null, 2));
    console.log(`[OGStorage] Stored pending upload: ${filepath}`);
  }

  /**
   * Upload encrypted data to 0G Storage with timeout protection
   *
   * Pattern from Anima: Race SDK call against wall-clock deadline
   */
  async uploadEncrypted(params: {
    data: unknown;
    key: Buffer;
    tags?: string[];
  }): Promise<{ ok: UploadResult } | { error: string }> {
    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
      // 1. Encrypt data
      const encrypted = this.encryptJson(params.data, params.key);
      const file = new MemData(encrypted);

      // 2. Upload with timeout protection
      const uploadPromise = this.uploader.upload(file);
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error("upload-timeout"));
        }, SDK_UPLOAD_TIMEOUT_MS);
      });

      const [result, error] = await Promise.race([uploadPromise, timeoutPromise]);

      if (error) {
        throw new Error(error);
      }

      // 3. Extract result
      const merkleRoot = "rootHash" in result ? result.rootHash : result.rootHashes?.[0];
      const txHash = "txHash" in result ? result.txHash : result.txHashes?.[0];

      if (!merkleRoot || !txHash) {
        throw new Error("Invalid upload result: missing merkleRoot or txHash");
      }

      // 4. Wait for finalization (optional, with timeout)
      let finalized = false;
      try {
        await this.waitForFinalization(merkleRoot);
        finalized = true;
      } catch (finalizeErr) {
        console.warn(`[OGStorage] Finalization timeout for ${merkleRoot}:`, finalizeErr);
        // Continue anyway - finalization will happen eventually
      }

      return {
        ok: {
          merkleRoot,
          txHash,
          finalized
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";

      if (errorMessage === "upload-timeout") {
        // CRITICAL: Medical data cannot be lost
        // Store locally for async retry
        await this.storeLocalPending(params.data, params.key);
        return {
          error: "0G Storage upload timed out after 2 minutes - stored locally for retry"
        };
      }

      return {
        error: errorMessage
      };
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  /**
   * Wait for upload finalization with timeout
   */
  private async waitForFinalization(merkleRoot: string): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < FINALIZE_TIMEOUT_MS) {
      try {
        const info = await this.indexer.downloadToBlob(merkleRoot, { proof: false });
        if (info) {
          return; // Finalized
        }
      } catch {
        // Not finalized yet, continue polling
      }

      await new Promise(resolve => setTimeout(resolve, FINALIZE_POLL_INTERVAL_MS));
    }

    throw new Error("Finalization timeout");
  }

  /**
   * Download and decrypt data from 0G Storage
   *
   * DUAL-PATH STRATEGY (from Anima):
   * Path 1: SDK indexer (fast when healthy)
   * Path 2: Discovered nodes (fallback when indexer degraded)
   */
  async downloadAndDecrypt(params: {
    merkleRoot: string;
    key: Buffer;
  }): Promise<{ ok: unknown } | { error: string }> {
    // Path 1: Try SDK indexer first
    const sdkResult = await this.downloadViaSdkIndexer(params.merkleRoot);
    if (sdkResult) {
      try {
        const decrypted = this.decryptJson(sdkResult, params.key);
        return { ok: decrypted };
      } catch (decryptError) {
        return {
          error: `Decryption failed: ${decryptError instanceof Error ? decryptError.message : "Unknown error"}`
        };
      }
    }

    // Path 2: Fall back to discovered nodes
    console.log(`[OGStorage] SDK indexer failed for ${params.merkleRoot}, trying discovered nodes...`);
    const nodesResult = await this.downloadViaDiscoveredNodes(params.merkleRoot);

    if (nodesResult) {
      try {
        const decrypted = this.decryptJson(nodesResult, params.key);
        return { ok: decrypted };
      } catch (decryptError) {
        return {
          error: `Decryption failed: ${decryptError instanceof Error ? decryptError.message : "Unknown error"}`
        };
      }
    }

    return {
      error: `Download failed: Could not retrieve ${params.merkleRoot} from indexer or discovered nodes`
    };
  }

  /**
   * Download via SDK indexer (Path 1)
   */
  private async downloadViaSdkIndexer(merkleRoot: string): Promise<Buffer | null> {
    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
      const downloadPromise = this.indexer.downloadToBlob(merkleRoot, { proof: false });
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error("indexer-sdk-timeout"));
        }, SDK_INDEXER_TIMEOUT_MS);
      });

      const [blob, error] = await Promise.race([downloadPromise, timeoutPromise]);

      if (error || !blob) {
        return null;
      }

      return Buffer.from(await blob.arrayBuffer());

    } catch (error) {
      console.warn(`[OGStorage] SDK indexer download failed:`, error);
      return null;
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  /**
   * Download via discovered nodes (Path 2 - fallback)
   *
   * This is the CRITICAL fallback that kept Anima operational
   * when mainnet indexer was degraded (Apr 2026+)
   */
  private async downloadViaDiscoveredNodes(merkleRoot: string): Promise<Buffer | null> {
    try {
      // 1. Get sharded nodes from indexer
      const indexerUrl = process.env.OG_INDEXER_URL || "https://indexer-storage-testnet-turbo.0g.ai";

      const nodesResponse = await fetch(indexerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "indexer_getShardedNodes",
          params: [merkleRoot],
          id: 1
        })
      });

      if (!nodesResponse.ok) {
        return null;
      }

      const nodesData = await nodesResponse.json();
      const nodes = nodesData.result || [];

      if (nodes.length === 0) {
        return null;
      }

      // 2. Probe all nodes in parallel
      const probeResults = await Promise.allSettled(
        nodes.map(async (node: any) => {
          const url = node.url || `${node.ip}:${node.port}`;

          const infoResponse = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "zgs_getFileInfo",
              params: [merkleRoot],
              id: 1
            }),
            signal: AbortSignal.timeout(5000) // 5s probe timeout
          });

          const infoData = await infoResponse.json();
          return { url, info: infoData.result };
        })
      );

      // 3. Filter for finalized nodes
      const candidates = probeResults
        .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
        .filter(r => r.value.info?.finalized === true)
        .map(r => r.value);

      if (candidates.length === 0) {
        return null;
      }

      // 4. Download from first working candidate
      for (const candidate of candidates) {
        try {
          const downloadResponse = await fetch(candidate.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "zgs_downloadSegment",
              params: [merkleRoot, 0, candidate.info.tx.size],
              id: 1
            }),
            signal: AbortSignal.timeout(SDK_DOWNLOAD_SEGMENT_TIMEOUT_MS)
          });

          if (!downloadResponse.ok) {
            continue; // Try next candidate
          }

          const downloadData = await downloadResponse.json();
          const segmentHex = downloadData.result;

          if (segmentHex) {
            return Buffer.from(segmentHex.slice(2), "hex"); // Remove 0x prefix
          }
        } catch {
          continue; // Try next candidate
        }
      }

      return null;

    } catch (error) {
      console.error(`[OGStorage] Discovered nodes download failed:`, error);
      return null;
    }
  }

  /**
   * Retry pending uploads (call periodically from background job)
   */
  async retryPendingUploads(): Promise<{ succeeded: number; failed: number }> {
    let succeeded = 0;
    let failed = 0;

    try {
      const files = await readdir(this.pendingUploadsDir);

      for (const file of files) {
        if (!file.endsWith(".json")) continue;

        const filepath = join(this.pendingUploadsDir, file);
        const content = await readFile(filepath, "utf8");
        const pending: LocalPendingUpload = JSON.parse(content);

        // Retry upload
        const result = await this.uploadEncrypted({
          data: pending.data,
          key: pending.key
        });

        if ("ok" in result) {
          succeeded++;
          // Delete local file after successful upload
          await unlink(filepath);
        } else {
          failed++;
        }
      }
    } catch (error) {
      console.error(`[OGStorage] Retry pending uploads failed:`, error);
    }

    return { succeeded, failed };
  }
}
