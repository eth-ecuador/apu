import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DualNetworkProvider } from "../../../../packages/backend/src/services/dual-network-provider.service.js";

const SubmitSchema = z.object({
  patientAddress: z.string(),
  encryptedRiskScore: z.string(),
  proof: z.string(),
  symptoms: z.string(),
  medicalHistory: z.object({}).passthrough()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = SubmitSchema.parse(body);

    const encryptedRiskScore = Buffer.from(data.encryptedRiskScore, "hex");
    const proof = Buffer.from(data.proof, "hex");

    const signature = await deriveSignature(data.patientAddress);
    const { deriveEncryptionKey } = await import("../../../lib/fhe");
    const encryptionKey = await deriveEncryptionKey(signature);

    const dualNetwork = new DualNetworkProvider();

    const result = await dualNetwork.executeDiagnosisFlow({
      patientAddress: data.patientAddress,
      encryptedRiskScore: new Uint8Array(encryptedRiskScore),
      proof: new Uint8Array(proof),
      symptoms: data.symptoms,
      medicalHistory: data.medicalHistory,
      encryptionKey
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionHash: result.ok.networks.sepolia.submitTx,
      diagnosisId: result.ok.diagnosisId,
      networks: result.ok.networks
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function deriveSignature(address: string): Promise<string> {
  const message = `APU Medical AI - ${address}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(hashBuffer).toString("hex");
}
