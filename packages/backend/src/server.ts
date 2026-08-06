/**
 * APU Backend API Server
 *
 * Production-ready Express server integrating:
 * - Zama FHE encryption (Sepolia)
 * - 0G Storage (encrypted medical documents)
 * - 0G Compute (AI diagnosis with TEE)
 * - Smart contract interaction
 */
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { OGStorageService } from "./services/og-storage.service.js";
import { OGComputeService } from "./services/og-compute.service.js";
import { MedicalContractService } from "./services/medical-contract.service.js";
import { randomBytes } from "crypto";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Initialize services
let storageService: OGStorageService;
let computeService: OGComputeService;
let contractService: MedicalContractService;

try {
  storageService = new OGStorageService();
  computeService = new OGComputeService();
  contractService = new MedicalContractService();
  console.log("[Server] ✓ All services initialized");
} catch (error) {
  console.error("[Server] ✗ Service initialization failed:", error);
  process.exit(1);
}

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      storage: "0G Storage",
      compute: "0G Compute",
      contract: "MedicalDataRegistry",
    },
    network: {
      sepolia: process.env.SEPOLIA_RPC_URL,
      ogGalileo: process.env.OG_RPC_URL,
      contractAddress: process.env.MEDICAL_REGISTRY_ADDRESS,
    },
    note: "FHE encryption handled by frontend with @zama-fhe/sdk/web"
  });
});

// API endpoint: Submit patient data
// POST /api/patient/submit
// Body: {
//   patientAddress: string,
//   medicalData: object,
//   symptoms: string,
//   vitalSigns: object,
//   encryptedRiskScore: string, // FHE encrypted by frontend
//   proof: string               // ZK proof from frontend
// }
app.post("/api/patient/submit", async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const {
      patientAddress,
      medicalData,
      symptoms,
      vitalSigns,
      encryptedRiskScore,
      proof
    } = req.body;

    if (!patientAddress || !medicalData || !encryptedRiskScore || !proof) {
      res.status(400).json({
        error: "Missing required fields: patientAddress, medicalData, encryptedRiskScore, proof"
      });
      return;
    }

    console.log("[API] Submitting patient data...");
    console.log(`[API]   Patient: ${patientAddress}`);

    // 1. Prepare medical data for 0G Storage
    const storageKey = randomBytes(32);
    const fullMedicalData = {
      patientAddress,
      medicalData,
      symptoms,
      vitalSigns,
      timestamp: new Date().toISOString(),
    };

    // 2. Upload encrypted data to 0G Storage
    console.log("[API] Uploading to 0G Storage...");
    const uploadResult = await storageService.uploadEncrypted({
      data: fullMedicalData,
      key: storageKey,
      tags: ["medical", "patient", patientAddress],
    });

    if ("error" in uploadResult) {
      throw new Error(`0G Storage upload failed: ${uploadResult.error}`);
    }

    const { merkleRoot, txHash } = uploadResult.ok;
    console.log(`[API]   Merkle Root: ${merkleRoot}`);
    console.log(`[API]   TX Hash: ${txHash}`);

    // 3. Submit to smart contract with FHE data from frontend
    console.log("[API] Submitting to smart contract...");
    console.log(`[API]   Encrypted Risk Score: ${encryptedRiskScore.substring(0, 20)}...`);
    const receipt = await contractService.submitPatientData({
      encryptedRiskScore,
      proof,
      ogStorageRoot: merkleRoot,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[API] ✓ Patient data submitted (${elapsed}s)`);

    res.json({
      success: true,
      data: {
        patientAddress,
        storage: {
          merkleRoot,
          txHash,
          encrypted: true,
        },
        contract: {
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        },
        storageKey: storageKey.toString("hex"), // Return to client for decryption
      },
      elapsed: `${elapsed}s`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[API] ✗ Submit failed:", errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

// API endpoint: Run AI diagnosis
// POST /api/diagnosis/run
// Body: { patientAddress: string, symptoms: string, medicalHistory: object }
app.post("/api/diagnosis/run", async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { patientAddress, symptoms, medicalHistory } = req.body;

    if (!patientAddress || !symptoms) {
      res.status(400).json({ error: "Missing required fields: patientAddress, symptoms" });
      return;
    }

    console.log("[API] Running AI diagnosis...");
    console.log(`[API]   Patient: ${patientAddress}`);
    console.log(`[API]   Symptoms: ${symptoms}`);

    // Run AI inference via 0G Compute with TEE
    const diagnosisResult = await computeService.runDiagnosisInference({
      symptoms,
      medicalHistory: medicalHistory || {},
    });

    if ("error" in diagnosisResult) {
      throw new Error(`AI diagnosis failed: ${diagnosisResult.error}`);
    }

    const { diagnosis, confidence, verificationComponents, timestamp } = diagnosisResult.ok;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[API] ✓ AI diagnosis completed (${elapsed}s)`);
    console.log(`[API]   Diagnosis: ${diagnosis.substring(0, 100)}...`);
    console.log(`[API]   Confidence: ${confidence}%`);
    console.log(`[API]   TEE Verified: ${verificationComponents.zgTeeVerified}`);

    res.json({
      success: true,
      data: {
        patientAddress,
        diagnosis,
        confidence,
        teeSignature: verificationComponents.zgTeeSignature,
        teeVerified: verificationComponents.zgTeeVerified,
        verificationComponents,
        timestamp,
      },
      elapsed: `${elapsed}s`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[API] ✗ Diagnosis failed:", errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

// API endpoint: Store diagnosis in contract
// POST /api/diagnosis/store
// Body: {
//   patientAddress: string,
//   encryptedDiagnosis: string,  // FHE encrypted by frontend
//   proof: string,                // ZK proof from frontend
//   teeSignature: string
// }
app.post("/api/diagnosis/store", async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { patientAddress, encryptedDiagnosis, proof, teeSignature } = req.body;

    if (!patientAddress || !encryptedDiagnosis || !proof || !teeSignature) {
      res.status(400).json({
        error: "Missing required fields: patientAddress, encryptedDiagnosis, proof, teeSignature",
      });
      return;
    }

    console.log("[API] Storing diagnosis in contract...");
    console.log(`[API]   Patient: ${patientAddress}`);
    console.log(`[API]   Encrypted Diagnosis: ${encryptedDiagnosis.substring(0, 20)}...`);

    // Check if doctor is authorized
    const doctorAddress = contractService.getWalletAddress();
    const isAuthorized = await contractService.isAuthorizedDoctor(doctorAddress);

    if (!isAuthorized) {
      // Auto-authorize in development (in production, owner would authorize manually)
      console.log("[API] Doctor not authorized, authorizing...");
      await contractService.authorizeDoctor(doctorAddress);
    }

    // Store in contract with FHE data from frontend
    console.log("[API] Storing in smart contract...");
    const receipt = await contractService.storeDiagnosis({
      patient: patientAddress,
      encryptedDiagnosis,
      proof,
      teeSignature,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[API] ✓ Diagnosis stored (${elapsed}s)`);

    res.json({
      success: true,
      data: {
        patientAddress,
        contract: {
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        },
      },
      elapsed: `${elapsed}s`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[API] ✗ Store diagnosis failed:", errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

// API endpoint: Get patient record
// GET /api/patient/:address
app.get("/api/patient/:address", async (req: Request, res: Response) => {
  try {
    const address = req.params.address as string;

    console.log("[API] Fetching patient record...");
    console.log(`[API]   Patient: ${address}`);

    const record = await contractService.getPatientRecord(address);

    // Check if patient has data
    if (!record.hasData) {
      res.status(404).json({ error: "Patient record not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        patientAddress: address,
        hasData: record.hasData,
        diagnosed: record.diagnosed,
        ogStorageRoot: record.ogStorageRoot,
        submittedAt: new Date(Number(record.submittedAt) * 1000).toISOString(),
        diagnosedAt: record.diagnosed
          ? new Date(Number(record.diagnosedAt) * 1000).toISOString()
          : null,
        // Note: encrypted fields remain encrypted
        encrypted: {
          riskScore: record.encryptedRiskScore.toString(),
          diagnosis: record.encryptedDiagnosis.toString(),
        },
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[API] ✗ Fetch patient failed:", errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

// API endpoint: Download medical data from 0G Storage
// POST /api/storage/download
// Body: { merkleRoot: string, encryptionKey: string }
app.post("/api/storage/download", async (req: Request, res: Response) => {
  try {
    const { merkleRoot, encryptionKey } = req.body;

    if (!merkleRoot || !encryptionKey) {
      res.status(400).json({ error: "Missing required fields: merkleRoot, encryptionKey" });
      return;
    }

    console.log("[API] Downloading from 0G Storage...");
    console.log(`[API]   Merkle Root: ${merkleRoot}`);

    const key = Buffer.from(encryptionKey, "hex");
    const downloadResult = await storageService.downloadAndDecrypt({ merkleRoot, key });

    if ("error" in downloadResult) {
      throw new Error(`Download failed: ${downloadResult.error}`);
    }

    console.log("[API] ✓ Data downloaded and decrypted");

    res.json({
      success: true,
      data: downloadResult.ok,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[API] ✗ Download failed:", errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

// API endpoint: Get contract stats
// GET /api/stats
app.get("/api/stats", async (req: Request, res: Response) => {
  try {
    const stats = await contractService.getStats();
    const owner = await contractService.getOwner();

    res.json({
      success: true,
      data: {
        totalPatients: stats.totalPatients.toString(),
        totalDiagnoses: stats.totalDiagnoses.toString(),
        contractAddress: contractService.getAddress(),
        owner,
        network: "Sepolia",
        chainId: 11155111,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[API] ✗ Stats fetch failed:", errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("[Server] Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log("\n=== APU Backend API Server ===");
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log("\nEndpoints:");
  console.log(`  POST /api/patient/submit          - Submit patient data`);
  console.log(`  POST /api/diagnosis/run            - Run AI diagnosis`);
  console.log(`  POST /api/diagnosis/store          - Store diagnosis in contract`);
  console.log(`  GET  /api/patient/:address         - Get patient record`);
  console.log(`  POST /api/storage/download         - Download from 0G Storage`);
  console.log(`  GET  /api/stats                    - Get contract stats`);
  console.log("\nIntegrations:");
  console.log(`  ✓ 0G Storage (Galileo Testnet)`);
  console.log(`  ✓ 0G Compute (TEE AI Inference)`);
  console.log(`  ✓ Zama FHE (Sepolia)`);
  console.log(`  ✓ MedicalDataRegistry: ${contractService.getAddress()}`);
  console.log("================================\n");
});

// Helper function: Calculate risk score from vital signs and symptoms
function calculateRiskScore(
  vitalSigns?: { heartRate?: number; bloodPressure?: string; temperature?: number },
  symptoms?: string
): number {
  let score = 50; // baseline

  if (!vitalSigns) return score;

  // Heart rate analysis
  if (vitalSigns.heartRate) {
    if (vitalSigns.heartRate > 100 || vitalSigns.heartRate < 60) {
      score += 15;
    }
    if (vitalSigns.heartRate > 120 || vitalSigns.heartRate < 50) {
      score += 20;
    }
  }

  // Temperature analysis
  if (vitalSigns.temperature) {
    if (vitalSigns.temperature > 38 || vitalSigns.temperature < 36) {
      score += 10;
    }
    if (vitalSigns.temperature > 39.5 || vitalSigns.temperature < 35) {
      score += 20;
    }
  }

  // Blood pressure analysis (simplified)
  if (vitalSigns.bloodPressure) {
    const [systolic] = vitalSigns.bloodPressure.split("/").map(Number);
    if (systolic > 140 || systolic < 90) {
      score += 15;
    }
  }

  // Symptom severity (basic text analysis)
  if (symptoms) {
    const severityKeywords = ["severe", "extreme", "unbearable", "emergency", "critical"];
    if (severityKeywords.some((keyword) => symptoms.toLowerCase().includes(keyword))) {
      score += 25;
    }
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

export default app;
