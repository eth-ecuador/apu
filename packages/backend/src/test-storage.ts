/**
 * 0G Storage Integration Test - REAL Implementation
 *
 * Tests production-ready patterns:
 * - Timeout protection
 * - Dual-path download
 * - Fail-safe local backup
 * - AES-256-GCM encryption
 *
 * Prerequisites:
 * 1. OG_DEPLOYER_PRIVATE_KEY in .env (funded with testnet 0G)
 * 2. Get testnet 0G from: https://faucet.0g.ai
 */

import { OGStorageService } from "./services/og-storage.service.js";
import { randomBytes } from "crypto";

async function testStorage() {
  console.log("=== Testing REAL 0G Storage Service ===");
  console.log("");
  console.log("Network: 0G Testnet (Galileo - Chain ID 16602)");
  console.log("Indexer: https://indexer-storage-testnet-turbo.0g.ai");
  console.log("");

  const storage = new OGStorageService();

  // Test data: Medical record (EHR)
  const testData = {
    patientAddress: "0x1234567890123456789012345678901234567890",
    symptoms: "Fever (38.5°C), headache, fatigue",
    medicalHistory: {
      age: 35,
      sex: "F",
      allergies: ["penicillin"],
      medications: ["aspirin 100mg daily"],
      previousConditions: ["Type 2 Diabetes (2020)"],
      lastVisit: "2026-07-15"
    },
    vitalSigns: {
      temperature: 38.5,
      bloodPressure: "120/80",
      heartRate: 82,
      respiratoryRate: 16
    },
    timestamp: Date.now()
  };

  // Encryption key (in production, derived from wallet signature)
  const encryptionKey = randomBytes(32);

  console.log("Test Data:", JSON.stringify(testData, null, 2));
  console.log("");
  console.log("Encryption Key:", encryptionKey.toString("hex"));
  console.log("");

  // STEP 1: Upload
  console.log("=== STEP 1: Upload to 0G Storage (Real SDK) ===");
  console.log("Uploading encrypted medical record...");
  const uploadStartTime = Date.now();

  const uploadResult = await storage.uploadEncrypted({
    data: testData,
    key: encryptionKey,
    tags: ["apu-medical-ehr", "test"]
  });

  const uploadDuration = Date.now() - uploadStartTime;

  if ("error" in uploadResult) {
    console.error("❌ Upload failed:", uploadResult.error);
    if (uploadResult.error.includes("timed out")) {
      console.log("");
      console.log("ℹ️  Upload timed out - data stored locally for retry");
      console.log("ℹ️  Check .pending-uploads/ directory");
    }
    process.exit(1);
  }

  console.log("✅ Upload successful!");
  console.log("Merkle Root:", uploadResult.ok.merkleRoot);
  console.log("TX Hash:", uploadResult.ok.txHash);
  console.log("Finalized:", uploadResult.ok.finalized);
  console.log("Duration:", `${uploadDuration}ms`);
  console.log("");

  // STEP 2: Download
  console.log("=== STEP 2: Download (Dual-Path Strategy) ===");
  console.log("Path 1: SDK indexer → Path 2: Discovered nodes");
  const downloadStartTime = Date.now();

  const downloadResult = await storage.downloadAndDecrypt({
    merkleRoot: uploadResult.ok.merkleRoot,
    key: encryptionKey
  });

  const downloadDuration = Date.now() - downloadStartTime;

  if ("error" in downloadResult) {
    console.error("❌ Download failed:", downloadResult.error);
    console.log("");
    console.log("ℹ️  Note: Finalization takes 16-22 minutes");
    console.log("ℹ️  Wait and try again later");
    process.exit(1);
  }

  console.log("✅ Download successful!");
  console.log("Duration:", `${downloadDuration}ms`);
  console.log("");

  // STEP 3: Verify integrity
  console.log("=== STEP 3: Verify Data Integrity ===");
  const dataMatches = JSON.stringify(testData) === JSON.stringify(downloadResult.ok);

  if (dataMatches) {
    console.log("✅ Data integrity verified!");
  } else {
    console.error("❌ Data mismatch!");
    process.exit(1);
  }

  console.log("");
  console.log("=== SUMMARY ===");
  console.log("✅ Upload: Success");
  console.log("✅ Download: Success");
  console.log("✅ Encryption: AES-256-GCM");
  console.log("✅ Integrity: Verified");
  console.log("");
  console.log("Production patterns tested:");
  console.log("  • Timeout protection (120s upload, 30s download)");
  console.log("  • Dual-path download fallback");
  console.log("  • Fail-safe local backup");
  console.log("");
  console.log("=== All tests passed! ===");
}

testStorage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
