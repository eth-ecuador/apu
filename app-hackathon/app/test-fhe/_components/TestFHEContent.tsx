"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubmitHealthData } from "@/app/hooks/useHealthData";

export default function TestFHEContent() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { submitHealthData } = useSubmitHealthData();

  const [riskScore, setRiskScore] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async () => {
    try {
      setStatus("Encrypting & submitting...");
      const hash = await submitHealthData(Number(riskScore));
      setStatus(`Success! TX: ${hash}`);
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Connect Wallet to Test FHE</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={openConnectModal} className="w-full">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>FHE Test - Simple</CardTitle>
          <p className="text-sm text-gray-500">Connected: {address?.slice(0, 10)}...</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label>Risk Score (0-100)</label>
            <Input
              type="number"
              value={riskScore}
              onChange={(e) => setRiskScore(e.target.value)}
              placeholder="Enter 0-100"
            />
          </div>

          <Button onClick={handleSubmit} disabled={!riskScore} className="w-full">
            Submit Encrypted Data
          </Button>

          {status && (
            <div className="p-3 bg-gray-100 rounded text-sm">
              {status}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
