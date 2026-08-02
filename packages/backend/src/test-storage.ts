import { OGStorageService } from "./services/og-storage.service.js";
import { randomBytes } from "crypto";

async function testStorage() {
  console.log("=== Testing 0G Storage Service ===");
  console.log("");

  const storage = new OGStorageService();

  const testData = {
    patientAddress: "0x1234567890123456789012345678901234567890",
    symptoms: "Fever, headache, fatigue",
    medicalHistory: {
      age: 35,
      allergies: ["penicillin"],
      medications: ["aspirin"],
      previousConditions: ["diabetes"]
    },
    timestamp: Date.now()
  };

  const encryptionKey = randomBytes(32);

  console.log("Test Data:", JSON.stringify(testData, null, 2));
  console.log("");

  console.log("Step 1: Uploading encrypted data to 0G Storage...");
  const uploadResult = await storage.uploadEncrypted({
    data: testData,
    key: encryptionKey,
    tags: ["test-medical-history"]
  });

  if ("error" in uploadResult) {
    console.error("❌ Upload failed:", uploadResult.error);
    process.exit(1);
  }

  console.log("✅ Upload successful!");
  console.log("Merkle Root:", uploadResult.ok.merkleRoot);
  console.log("TX Hash:", uploadResult.ok.txHash);
  console.log("");

  console.log("Step 2: Downloading and decrypting data from 0G Storage...");
  const downloadResult = await storage.downloadAndDecrypt({
    merkleRoot: uploadResult.ok.merkleRoot,
    key: encryptionKey
  });

  if ("error" in downloadResult) {
    console.error("❌ Download failed:", downloadResult.error);
    process.exit(1);
  }

  console.log("✅ Download successful!");
  console.log("Decrypted Data:", JSON.stringify(downloadResult.ok, null, 2));
  console.log("");

  const dataMatches = JSON.stringify(testData) === JSON.stringify(downloadResult.ok);

  if (dataMatches) {
    console.log("✅ Data integrity verified! Upload and download successful.");
  } else {
    console.error("❌ Data mismatch! Integrity check failed.");
    process.exit(1);
  }

  console.log("");
  console.log("=== All tests passed! ===");
}

testStorage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
