/**
 * Medical Data Registry Contract Service
 *
 * Interacts with deployed MedicalDataRegistry contract on Sepolia
 * Pattern from fhevm-hardhat-template for production use
 */
import { Contract, JsonRpcProvider, Wallet, TransactionReceipt } from "ethers";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load ABI from compiled artifacts
const ARTIFACT_PATH = join(
  __dirname,
  "../../../../fhevm-hardhat-template/artifacts/contracts/MedicalDataRegistry.sol/MedicalDataRegistry.json"
);

interface PatientRecord {
  encryptedRiskScore: bigint;
  encryptedDiagnosis: bigint;
  ogStorageRoot: string;
  teeSignature: string;
  submittedAt: bigint;
  diagnosedAt: bigint;
  hasData: boolean;
  diagnosed: boolean;
}

interface SubmitPatientDataParams {
  encryptedRiskScore: string; // encrypted data from FHE SDK
  proof: string; // ZK proof from FHE SDK
  ogStorageRoot: string; // bytes32 Merkle root from 0G Storage
}

interface StoreDiagnosisParams {
  patient: string; // patient address
  encryptedDiagnosis: string; // encrypted data from FHE SDK
  proof: string; // ZK proof from FHE SDK
  teeSignature: string; // TEE attestation from 0G Compute
}

export class MedicalContractService {
  private contract: Contract;
  private provider: JsonRpcProvider;
  private wallet: Wallet;
  private contractAddress: string;

  constructor() {
    const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    this.contractAddress = process.env.MEDICAL_REGISTRY_ADDRESS || "";

    if (!privateKey) {
      throw new Error("DEPLOYER_PRIVATE_KEY not set in environment");
    }

    if (!this.contractAddress) {
      throw new Error("MEDICAL_REGISTRY_ADDRESS not set in environment");
    }

    // Load ABI
    let abi: unknown[];
    try {
      const artifact = JSON.parse(readFileSync(ARTIFACT_PATH, "utf8"));
      abi = artifact.abi;
    } catch (error) {
      throw new Error(
        `Failed to load contract ABI from ${ARTIFACT_PATH}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    this.provider = new JsonRpcProvider(rpcUrl);
    this.wallet = new Wallet(privateKey, this.provider);
    this.contract = new Contract(this.contractAddress, abi, this.wallet);

    console.log("[MedicalContract] ✓ Connected to MedicalDataRegistry");
    console.log(`[MedicalContract]   Address: ${this.contractAddress}`);
    console.log(`[MedicalContract]   Network: Sepolia (11155111)`);
  }

  /**
   * Submit encrypted patient data with 0G Storage reference
   *
   * @param params - Encrypted risk score, proof, and storage root
   * @returns Transaction receipt
   */
  async submitPatientData(params: SubmitPatientDataParams): Promise<TransactionReceipt> {
    console.log("[MedicalContract] Submitting patient data...");
    console.log(`[MedicalContract]   Storage Root: ${params.ogStorageRoot}`);

    try {
      // Estimate gas first
      const gasEstimate = await this.contract.submitPatientData.estimateGas(
        params.encryptedRiskScore,
        params.proof,
        params.ogStorageRoot
      );

      console.log(`[MedicalContract]   Gas estimate: ${gasEstimate.toString()}`);

      // Submit transaction
      const tx = await this.contract.submitPatientData(
        params.encryptedRiskScore,
        params.proof,
        params.ogStorageRoot,
        {
          gasLimit: (gasEstimate * 120n) / 100n, // 20% buffer
        }
      );

      console.log(`[MedicalContract]   TX hash: ${tx.hash}`);
      console.log("[MedicalContract]   Waiting for confirmation...");

      // Wait for confirmation
      const receipt = await tx.wait(1);

      console.log("[MedicalContract] ✓ Patient data submitted");
      console.log(`[MedicalContract]   Block: ${receipt?.blockNumber}`);
      console.log(`[MedicalContract]   Gas used: ${receipt?.gasUsed.toString()}`);

      return receipt;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[MedicalContract] ✗ Submit failed:", errorMessage);
      throw new Error(`Failed to submit patient data: ${errorMessage}`);
    }
  }

  /**
   * Store diagnosis from authorized doctor with TEE verification
   *
   * @param params - Patient, encrypted diagnosis, proof, and TEE signature
   * @returns Transaction receipt
   */
  async storeDiagnosis(params: StoreDiagnosisParams): Promise<TransactionReceipt> {
    console.log("[MedicalContract] Storing diagnosis...");
    console.log(`[MedicalContract]   Patient: ${params.patient}`);
    console.log(`[MedicalContract]   Doctor: ${this.wallet.address}`);

    try {
      // Check if doctor is authorized
      const isAuthorized = await this.contract.authorizedDoctors(this.wallet.address);
      if (!isAuthorized) {
        throw new Error(`Doctor ${this.wallet.address} is not authorized`);
      }

      // Estimate gas
      const gasEstimate = await this.contract.storeDiagnosis.estimateGas(
        params.patient,
        params.encryptedDiagnosis,
        params.proof,
        params.teeSignature
      );

      console.log(`[MedicalContract]   Gas estimate: ${gasEstimate.toString()}`);

      // Submit transaction
      const tx = await this.contract.storeDiagnosis(
        params.patient,
        params.encryptedDiagnosis,
        params.proof,
        params.teeSignature,
        {
          gasLimit: (gasEstimate * 120n) / 100n, // 20% buffer
        }
      );

      console.log(`[MedicalContract]   TX hash: ${tx.hash}`);
      console.log("[MedicalContract]   Waiting for confirmation...");

      // Wait for confirmation
      const receipt = await tx.wait(1);

      console.log("[MedicalContract] ✓ Diagnosis stored");
      console.log(`[MedicalContract]   Block: ${receipt?.blockNumber}`);
      console.log(`[MedicalContract]   Gas used: ${receipt?.gasUsed.toString()}`);

      return receipt;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[MedicalContract] ✗ Store failed:", errorMessage);
      throw new Error(`Failed to store diagnosis: ${errorMessage}`);
    }
  }

  /**
   * Get patient record (encrypted data remains encrypted on-chain)
   *
   * @param patientAddress - Patient address
   * @returns Patient record with encrypted fields
   */
  async getPatientRecord(patientAddress: string): Promise<PatientRecord> {
    console.log("[MedicalContract] Fetching patient record...");
    console.log(`[MedicalContract]   Patient: ${patientAddress}`);

    try {
      const record = await this.contract.getPatientRecord(patientAddress);

      return {
        encryptedRiskScore: record.encryptedRiskScore,
        encryptedDiagnosis: record.encryptedDiagnosis,
        ogStorageRoot: record.ogStorageRoot,
        teeSignature: record.teeSignature,
        submittedAt: record.submittedAt,
        diagnosedAt: record.diagnosedAt,
        hasData: record.hasData,
        diagnosed: record.diagnosed,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[MedicalContract] ✗ Fetch failed:", errorMessage);
      throw new Error(`Failed to get patient record: ${errorMessage}`);
    }
  }

  /**
   * Check if a storage root is already anchored
   *
   * @param storageRoot - Merkle root to check
   * @returns Boolean indicating if root is anchored
   */
  async isRootAnchored(storageRoot: string): Promise<boolean> {
    try {
      return await this.contract.isRootAnchored(storageRoot);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[MedicalContract] ✗ Check failed:", errorMessage);
      throw new Error(`Failed to check root: ${errorMessage}`);
    }
  }

  /**
   * Update 0G Storage root (if blob was re-uploaded)
   *
   * @param patient - Patient address
   * @param newStorageRoot - New Merkle root from 0G Storage
   * @returns Transaction receipt
   */
  async updateStorageRoot(patient: string, newStorageRoot: string): Promise<TransactionReceipt> {
    console.log("[MedicalContract] Updating storage root...");
    console.log(`[MedicalContract]   Patient: ${patient}`);
    console.log(`[MedicalContract]   New Root: ${newStorageRoot}`);

    try {
      const tx = await this.contract.updateStorageRoot(patient, newStorageRoot);
      const receipt = await tx.wait(1);

      console.log("[MedicalContract] ✓ Storage root updated");
      return receipt;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[MedicalContract] ✗ Update failed:", errorMessage);
      throw new Error(`Failed to update storage root: ${errorMessage}`);
    }
  }

  /**
   * Authorize a doctor to store diagnoses (owner only)
   *
   * @param doctor - Doctor address to authorize
   * @returns Transaction receipt
   */
  async authorizeDoctor(doctor: string): Promise<TransactionReceipt> {
    console.log("[MedicalContract] Authorizing doctor...");
    console.log(`[MedicalContract]   Doctor: ${doctor}`);

    try {
      const tx = await this.contract.authorizeDoctor(doctor);
      const receipt = await tx.wait(1);

      console.log("[MedicalContract] ✓ Doctor authorized");
      return receipt;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[MedicalContract] ✗ Authorization failed:", errorMessage);
      throw new Error(`Failed to authorize doctor: ${errorMessage}`);
    }
  }

  /**
   * Revoke doctor authorization (owner only)
   *
   * @param doctor - Doctor address to revoke
   * @returns Transaction receipt
   */
  async revokeDoctor(doctor: string): Promise<TransactionReceipt> {
    console.log("[MedicalContract] Revoking doctor...");
    console.log(`[MedicalContract]   Doctor: ${doctor}`);

    try {
      const tx = await this.contract.revokeDoctor(doctor);
      const receipt = await tx.wait(1);

      console.log("[MedicalContract] ✓ Doctor revoked");
      return receipt;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[MedicalContract] ✗ Revocation failed:", errorMessage);
      throw new Error(`Failed to revoke doctor: ${errorMessage}`);
    }
  }

  /**
   * Check if an address is an authorized doctor
   *
   * @param doctor - Doctor address
   * @returns Boolean indicating if doctor is authorized
   */
  async isAuthorizedDoctor(doctor: string): Promise<boolean> {
    try {
      return await this.contract.authorizedDoctors(doctor);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[MedicalContract] ✗ Check failed:", errorMessage);
      throw new Error(`Failed to check doctor authorization: ${errorMessage}`);
    }
  }

  /**
   * Get contract statistics
   *
   * @returns Total patients and diagnoses
   */
  async getStats(): Promise<{ totalPatients: bigint; totalDiagnoses: bigint }> {
    try {
      const [totalPatients, totalDiagnoses] = await Promise.all([
        this.contract.totalPatients(),
        this.contract.totalDiagnoses(),
      ]);

      return { totalPatients, totalDiagnoses };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[MedicalContract] ✗ Stats fetch failed:", errorMessage);
      throw new Error(`Failed to get stats: ${errorMessage}`);
    }
  }

  /**
   * Get contract owner address
   *
   * @returns Owner address
   */
  async getOwner(): Promise<string> {
    try {
      return await this.contract.owner();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[MedicalContract] ✗ Owner fetch failed:", errorMessage);
      throw new Error(`Failed to get owner: ${errorMessage}`);
    }
  }

  /**
   * Get contract address
   *
   * @returns Contract address
   */
  getAddress(): string {
    return this.contractAddress;
  }

  /**
   * Get current wallet address
   *
   * @returns Wallet address
   */
  getWalletAddress(): string {
    return this.wallet.address;
  }
}
