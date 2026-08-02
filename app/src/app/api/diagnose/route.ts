import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const DiagnoseSchema = z.object({
  patientAddress: z.string(),
  doctorAddress: z.string()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = DiagnoseSchema.parse(body);

    return NextResponse.json({
      success: true,
      diagnosis: "Sample diagnosis result",
      confidence: 0.85,
      encryptedData: "encrypted_data_here"
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
