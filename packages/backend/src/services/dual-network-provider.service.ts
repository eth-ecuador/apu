import { ethers } from "ethers";
import { OGStorageService } from "./og-storage.service.js";
import { OGComputeService } from "./og-compute.service.js";

export interface DiagnosisFlowParams {
  patientAddress: string;
  encryptedRiskScore: Uint8Array;
  proof: Uint8Array;
  symptoms: string;
  medicalHistory: any;
  encryptionKey: Buffer;
}

export interface DiagnosisFlowResult {
  diagnosisId: string;
  diagnosis: string;
  confidence: number;
  networks: {
    sepolia: {
      submitTx: string;
      diagnosisTx: string;
      contract: string;
      explorer: string;
    };
    og: {
      storageRoot: string;
      computeRequestId: string;
    };
  };
}

export class DualNetworkProvider {
  private sepoliaProvider: ethers.JsonRpcProvider;
  private sepoliaWallet: ethers.Wallet;
  private sepoliaMedicalRegistry: ethers.Contract;

  private ogProvider: ethers.JsonRpcProvider;
  private ogWallet: ethers.Wallet;

  private ogStorage: OGStorageService;
  private ogCompute: OGComputeService;

  constructor() {
    // Sepolia (Zama FHE)
    this.sepoliaProvider = new ethers.JsonRpcProvider(
      process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com"
    );
    this.sepoliaWallet = new ethers.Wallet(
      process.env.DEPLOYER_PRIVATE_KEY!,
      this.sepoliaProvider
    );

    // Load MedicalDataRegistry contract (ABI would be imported)
    const registryAbi = [
      "function submitPatientData(bytes calldata encryptedRiskScore, bytes calldata proof, bytes32 ogStorageRoot) external",
      "function storeDiagnosis(address patient, bytes calldata encryptedDiagnosis, bytes calldata proof, bytes calldata teeSignature) external",
      "function updateStorageRoot(address patient, bytes32 newStorageRoot) external"
    ];

    this.sepoliaMedicalRegistry = new ethers.Contract(
      process.env.MEDICAL_REGISTRY_ADDRESS!,
      registryAbi,
      this.sepoliaWallet
    );

    // 0G Mainnet
    this.ogProvider = new ethers.JsonRpcProvider(
      process.env.OG_RPC_URL || "https://evmrpc.0g.ai"
    );
    this.ogWallet = new ethers.Wallet(
      process.env.OG_DEPLOYER_PRIVATE_KEY!,
      this.ogProvider
    );

    // 0G Services
    this.ogStorage = new OGStorageService();
    this.ogCompute = new OGComputeService();
  }

  /**
   * Execute complete diagnosis flow across both networks
   */
  async executeDiagnosisFlow(params: DiagnosisFlowParams): Promise<
    { ok: DiagnosisFlowResult } | { error: string }
  > {
    try {
      console.log("=== DUAL-NETWORK DIAGNOSIS FLOW ===");

      // STEP 1: Upload medical history to 0G Storage
      console.log("Step 1: Uploading to 0G Storage...");
      const storageResult = await this.ogStorage.uploadEncrypted({
        data: {
          patientAddress: params.patientAddress,
          symptoms: params.symptoms,
          medicalHistory: params.medicalHistory,
          timestamp: Date.now()
        },
        key: params.encryptionKey,
        tags: ["medical-history"]
      });

      if ("error" in storageResult) {
        return { error: `Storage upload failed: ${storageResult.error}` };
      }

      const { merkleRoot, txHash } = storageResult.ok;

      // STEP 2: Submit encrypted data to Sepolia
      console.log("Step 2: Submitting to Sepolia...");
      const sepoliaTx = await this.sepoliaMedicalRegistry.submitPatientData(
        params.encryptedRiskScore,
        params.proof,
        merkleRoot,
        { gasLimit: 3_000_000 }
      );
      await sepoliaTx.wait();

      // STEP 3: Run AI inference on 0G Compute
      console.log("Step 3: Running AI inference on 0G Compute...");
      const requestId = ethers.hexlify(ethers.randomBytes(16));
      const aiResult = await this.ogCompute.runDiagnosisInference({
        symptoms: params.symptoms,
        medicalHistory: params.medicalHistory,
        requestId
      });

      if ("error" in aiResult) {
        return { error: `AI inference failed: ${aiResult.error}` };
      }

      // STEP 4: Encrypt diagnosis and store on Sepolia
      console.log("Step 4: Storing diagnosis on Sepolia...");
      // In production, encrypt diagnosis with FHE SDK
      const encryptedDiagnosis = new Uint8Array([/* FHE encrypted */]);
      const diagnosisProof = new Uint8Array([/* ZK proof */]);

      const diagnosisTx = await this.sepoliaMedicalRegistry.storeDiagnosis(
        params.patientAddress,
        encryptedDiagnosis,
        diagnosisProof,
        aiResult.ok.teeSignature,
        { gasLimit: 3_000_000 }
      );
      await diagnosisTx.wait();

      return {
        ok: {
          diagnosisId: requestId,
          diagnosis: aiResult.ok.diagnosis,
          confidence: aiResult.ok.confidence,
          networks: {
            sepolia: {
              submitTx: sepoliaTx.hash,
              diagnosisTx: diagnosisTx.hash,
              contract: await this.sepoliaMedicalRegistry.getAddress(),
              explorer: `https://sepolia.etherscan.io/tx/${diagnosisTx.hash}`
            },
            og: {
              storageRoot: merkleRoot,
              computeRequestId: requestId
            }
          }
        }
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Diagnosis flow failed"
      };
    }
  }
}
