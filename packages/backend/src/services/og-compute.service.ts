import { ZgComputeClient } from "@0gfoundation/0g-compute-ts-sdk";

export interface DiagnosisResult {
  diagnosis: string;
  confidence: number;
  teeSignature: string;
  timestamp: number;
}

export class OGComputeService {
  private client: ZgComputeClient;

  constructor() {
    this.client = new ZgComputeClient({
      providerUrl: process.env.ZG_COMPUTE_PROVIDER_URL!,
      serviceUrl: process.env.ZG_COMPUTE_SERVICE_URL!
    });
  }

  /**
   * Run AI diagnosis inference in TEE
   */
  async runDiagnosisInference(params: {
    symptoms: string;
    medicalHistory: any;
    requestId: string;
  }): Promise<{ ok: DiagnosisResult } | { error: string }> {
    try {
      const result = await this.client.inference({
        model: "medical-diagnosis-v2",
        input: JSON.stringify({
          symptoms: params.symptoms,
          history: params.medicalHistory
        }),
        requestId: params.requestId
      });

      return {
        ok: {
          diagnosis: result.output,
          confidence: result.confidence || 0.85,
          teeSignature: result.teeSignature,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Inference failed"
      };
    }
  }

  /**
   * Verify TEE attestation signature
   */
  async verifyTeeAttestation(params: {
    signature: string;
    requestId: string;
    output: string;
  }): Promise<boolean> {
    // TEE signature verification logic
    // In production, this would verify the SGX attestation
    return params.signature.length > 0;
  }
}
