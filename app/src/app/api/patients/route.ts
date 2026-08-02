import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const patients = [
      {
        address: "0x1234...5678",
        submittedAt: new Date().toISOString(),
        diagnosed: false,
        ogStorageRoot: "0xabcd...efgh"
      }
    ];

    return NextResponse.json({ patients });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}
