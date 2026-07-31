"use client";

import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

// Hooks
import {
  useCurrentCounts,
  useHasSubmittedV2,
  useCurrentEpochIdV2,
  usePublicStatsV2,
  useMedicalConstants,
  useContractOwnerV2,
  useAuthorizedResearcherV2,
  usePatientErrorFlagV2,
} from "@/lib/hooks";
import {
  useSubmitPatientSelfReport,
  useSubmitClinicalAssessment,
  useClosePublicStatsEpoch,
  useAuthorizeResearcher,
  useDecryptPatientErrorFlag,
} from "@/app/hooks/useMedicalData";
import { ADDR } from "@/lib/addresses";

export default function MedicalRecordsContent() {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();

  // Contract state
  const { patientCount, providerCount, totalCount, refetch: refetchCounts } = useCurrentCounts();
  const hasSubmitted = useHasSubmittedV2(address);
  const { epochId, refetch: refetchEpochId } = useCurrentEpochIdV2();
  const owner = useContractOwnerV2();
  const researcher = useAuthorizedResearcherV2();
  const constants = useMedicalConstants();

  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();

  // Individual decryption (ghostlend pattern) - Patient's own error flag
  const errorFlagHandle = usePatientErrorFlagV2(address);
  const {
    decryptError,
    errorCode,
    errorLabel,
    isDecrypting,
    isRevealed,
  } = useDecryptPatientErrorFlag(errorFlagHandle as `0x${string}`);

  // ======================
  // Patient Self-Report State
  // ======================
  const [symptoms, setSymptoms] = useState({
    fever: false,
    cough: false,
    breathingDifficulty: false,
    chestPain: false,
  });
  const [painLevel, setPainLevel] = useState(0);
  const [selfReportStatus, setSelfReportStatus] = useState("");

  const { submitSelfReport } = useSubmitPatientSelfReport();

  // Calculate symptom bitmask
  const symptomsBitmask = useMemo(() => {
    let mask = 0;
    if (symptoms.fever) mask |= 1 << 0;
    if (symptoms.cough) mask |= 1 << 1;
    if (symptoms.breathingDifficulty) mask |= 1 << 2;
    if (symptoms.chestPain) mask |= 1 << 3;
    return mask;
  }, [symptoms]);

  // Calculate risk score from symptoms
  const calculatedRiskScore = useMemo(() => {
    let score = 0;
    if (symptoms.fever) score += 15;
    if (symptoms.cough) score += 10;
    if (symptoms.breathingDifficulty) score += 40;
    if (symptoms.chestPain) score += 35;
    return Math.min(score, 100);
  }, [symptoms]);

  const handleSelfReportSubmit = async () => {
    if (!address) {
      setSelfReportStatus("Please connect wallet");
      return;
    }

    try {
      setSelfReportStatus("Encrypting and submitting...");
      const hash = await submitSelfReport(calculatedRiskScore, symptomsBitmask, painLevel);
      setSelfReportStatus(`Submitted! Tx: ${hash.slice(0, 10)}...`);
      refetchCounts();
    } catch (error: any) {
      setSelfReportStatus(`Error: ${error.message}`);
    }
  };

  // ======================
  // Clinical Assessment State
  // ======================
  const [clinicalData, setClinicalData] = useState({
    patientAddress: "",
    systolicBP: 120,
    diastolicBP: 80,
    heartRate: 75,
    temperature: 370, // 37.0°C * 10
    oxygenSat: 98,
    clinicalPainLevel: 0,
    esiLevel: 3,
  });
  const [clinicalStatus, setClinicalStatus] = useState("");

  const { submitClinicalAssessment } = useSubmitClinicalAssessment();

  // Calculate clinical risk score
  const clinicalRiskScore = useMemo(() => {
    let score = 0;

    // BP contribution
    if (clinicalData.systolicBP > 140 || clinicalData.diastolicBP > 90) score += 20;

    // Heart rate contribution
    if (clinicalData.heartRate > 100 || clinicalData.heartRate < 60) score += 15;

    // Temperature contribution (fever)
    if (clinicalData.temperature > 380) score += 20;

    // O2 saturation contribution
    if (clinicalData.oxygenSat < 95) score += 25;

    // Pain contribution
    score += clinicalData.clinicalPainLevel * 2;

    // ESI level contribution (1=most critical, 5=least)
    score += (6 - clinicalData.esiLevel) * 5;

    return Math.min(score, 100);
  }, [clinicalData]);

  const handleClinicalSubmit = async () => {
    if (!address) {
      setClinicalStatus("Please connect wallet");
      return;
    }

    if (!isOwner) {
      setClinicalStatus("Only contract owner can submit clinical assessments");
      return;
    }

    if (!clinicalData.patientAddress || !clinicalData.patientAddress.startsWith("0x")) {
      setClinicalStatus("Please enter valid patient address");
      return;
    }

    try {
      setClinicalStatus("Encrypting and submitting...");
      const hash = await submitClinicalAssessment(
        clinicalData.patientAddress as `0x${string}`,
        {
          riskScore: clinicalRiskScore,
          systolicBP: clinicalData.systolicBP,
          diastolicBP: clinicalData.diastolicBP,
          heartRate: clinicalData.heartRate,
          temperature: clinicalData.temperature,
          oxygenSat: clinicalData.oxygenSat,
          painLevel: clinicalData.clinicalPainLevel,
          esiLevel: clinicalData.esiLevel,
        }
      );
      setClinicalStatus(`Submitted! Tx: ${hash.slice(0, 10)}...`);
      refetchCounts();
    } catch (error: any) {
      setClinicalStatus(`Error: ${error.message}`);
    }
  };

  // ======================
  // Public Stats State
  // ======================
  const [viewEpochId, setViewEpochId] = useState(0);
  const stats = usePublicStatsV2(viewEpochId);
  const [epochStatus, setEpochStatus] = useState("");

  const { closeEpoch } = useClosePublicStatsEpoch();

  const handleCloseEpoch = async () => {
    try {
      setEpochStatus("Closing epoch...");
      const hash = await closeEpoch();
      setEpochStatus(`Epoch closed! Tx: ${hash.slice(0, 10)}...`);
      refetchEpochId();
      refetchCounts();
    } catch (error: any) {
      setEpochStatus(`Error: ${error.message}`);
    }
  };

  // ======================
  // Admin State
  // ======================
  const [researcherAddress, setResearcherAddress] = useState("");
  const [adminStatus, setAdminStatus] = useState("");

  const { authorizeResearcher } = useAuthorizeResearcher();

  const handleAuthorizeResearcher = async () => {
    if (!researcherAddress || !researcherAddress.startsWith("0x")) {
      setAdminStatus("Please enter valid researcher address");
      return;
    }

    try {
      setAdminStatus("Authorizing researcher...");
      const hash = await authorizeResearcher(researcherAddress as `0x${string}`);
      setAdminStatus(`Authorized! Tx: ${hash.slice(0, 10)}...`);
    } catch (error: any) {
      setAdminStatus(`Error: ${error.message}`);
    }
  };

  // ======================
  // Render
  // ======================

  if (!address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Medical Records Platform</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Production-grade medical records with fully homomorphic encryption
            </p>
            <Button onClick={openConnectModal} className="w-full">
              Connect Wallet
            </Button>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Contract: {ADDR.medicalRecordsV2}</p>
              <p>Network: Sepolia Testnet</p>
              <p>Total Submissions: {totalCount} (Patient: {patientCount}, Provider: {providerCount})</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            APU Medical Records
          </h1>
          <p className="text-gray-600">
            Privacy-preserving medical data with FHE - Deployed on Sepolia
          </p>
        </div>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">Total Submissions</div>
                <div className="text-2xl font-bold">{totalCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Patient Reports</div>
                <div className="text-2xl font-bold text-blue-600">{patientCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Provider Assessments</div>
                <div className="text-2xl font-bold text-purple-600">{providerCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Current Epoch</div>
                <div className="text-2xl font-bold">{epochId}</div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Contract Address:</span>
                <span className="font-mono">{ADDR.medicalRecordsV2.slice(0, 10)}...</span>
              </div>
              <div className="flex justify-between">
                <span>Your Address:</span>
                <span className="font-mono">{address.slice(0, 10)}...</span>
              </div>
              <div className="flex justify-between">
                <span>Submission Status:</span>
                <span className={hasSubmitted ? "text-green-600" : "text-gray-400"}>
                  {hasSubmitted ? "Submitted" : "Not Submitted"}
                </span>
              </div>
              {isOwner && (
                <div className="flex justify-between">
                  <span>Role:</span>
                  <span className="text-purple-600 font-semibold">Contract Owner</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="patient" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="patient">Patient</TabsTrigger>
            <TabsTrigger value="provider">Provider</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          {/* ========== Patient Self-Report Tab ========== */}
          <TabsContent value="patient" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Patient Self-Report</CardTitle>
                <p className="text-sm text-gray-600">
                  Submit encrypted symptoms and pain level
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Symptoms */}
                <div className="space-y-3">
                  <Label>Symptoms (Select all that apply)</Label>
                  <div className="space-y-2">
                    {[
                      { key: "fever", label: "Fever" },
                      { key: "cough", label: "Cough" },
                      { key: "breathingDifficulty", label: "Breathing Difficulty" },
                      { key: "chestPain", label: "Chest Pain" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          checked={symptoms[key as keyof typeof symptoms]}
                          onCheckedChange={(checked) =>
                            setSymptoms({ ...symptoms, [key]: checked })
                          }
                        />
                        <Label className="cursor-pointer">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pain Level */}
                <div className="space-y-2">
                  <Label>Pain Level (0-10)</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="range"
                      min="0"
                      max="10"
                      value={painLevel}
                      onChange={(e) => setPainLevel(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-2xl font-bold w-12 text-center">{painLevel}</span>
                  </div>
                </div>

                {/* Calculated Risk Score */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Calculated Risk Score</div>
                  <div className="text-3xl font-bold text-blue-600">{calculatedRiskScore}/100</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Based on symptoms selected
                  </div>
                </div>

                <Separator />

                <Button
                  onClick={handleSelfReportSubmit}
                  disabled={hasSubmitted}
                  className="w-full"
                >
                  {hasSubmitted ? "Already Submitted" : "Submit Encrypted Self-Report"}
                </Button>

                {selfReportStatus && (
                  <div className="bg-gray-100 p-3 rounded text-sm">{selfReportStatus}</div>
                )}
              </CardContent>
            </Card>

            {/* Individual Decryption Card (Ghostlend Pattern) */}
            {hasSubmitted && (
              <Card>
                <CardHeader>
                  <CardTitle>View My Encrypted Data</CardTitle>
                  <p className="text-sm text-gray-600">
                    Decrypt your personal error flag (individual decryption - ghostlend pattern)
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!errorFlagHandle || errorFlagHandle === "0x0000000000000000000000000000000000000000000000000000000000000000" ? (
                    <div className="bg-gray-50 p-4 rounded text-sm text-gray-600">
                      No error flag available for your record.
                    </div>
                  ) : (
                    <>
                      <div className="bg-blue-50 p-4 rounded">
                        <div className="text-sm text-gray-600 mb-2">Error Flag Handle (Encrypted)</div>
                        <div className="font-mono text-xs break-all">{errorFlagHandle}</div>
                      </div>

                      <Button
                        onClick={decryptError}
                        disabled={isDecrypting || isRevealed}
                        className="w-full"
                      >
                        {isDecrypting
                          ? "Decrypting via KMS..."
                          : isRevealed
                          ? "Decrypted ✓"
                          : "Decrypt My Error Flag (Individual)"}
                      </Button>

                      {isRevealed && errorLabel && (
                        <div className="bg-green-50 border border-green-200 p-4 rounded">
                          <div className="text-sm text-gray-600">Decrypted Error Status</div>
                          <div className="text-2xl font-bold text-green-700">{errorLabel}</div>
                          <div className="text-xs text-gray-500 mt-1">Code: {errorCode}</div>
                          <div className="text-xs text-gray-500 mt-2">
                            ✓ Decrypted via KMS (individual pattern from ghostlend)
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ========== Provider Clinical Assessment Tab ========== */}
          <TabsContent value="provider" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Clinical Assessment (Owner Only)</CardTitle>
                <p className="text-sm text-gray-600">
                  Submit encrypted vital signs and ESI triage level
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isOwner && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                    <p className="text-yellow-800">Only the contract owner can submit clinical assessments.</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Patient Address</Label>
                  <Input
                    placeholder="0x..."
                    value={clinicalData.patientAddress}
                    onChange={(e) => setClinicalData({ ...clinicalData, patientAddress: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Systolic BP (mmHg)</Label>
                    <Input
                      type="number"
                      value={clinicalData.systolicBP}
                      onChange={(e) => setClinicalData({ ...clinicalData, systolicBP: Number(e.target.value) })}
                      max={constants.MAX_BP}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Diastolic BP (mmHg)</Label>
                    <Input
                      type="number"
                      value={clinicalData.diastolicBP}
                      onChange={(e) => setClinicalData({ ...clinicalData, diastolicBP: Number(e.target.value) })}
                      max={constants.MAX_BP}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Heart Rate (bpm)</Label>
                    <Input
                      type="number"
                      value={clinicalData.heartRate}
                      onChange={(e) => setClinicalData({ ...clinicalData, heartRate: Number(e.target.value) })}
                      max={constants.MAX_HEART_RATE}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Temperature (°C × 10)</Label>
                    <Input
                      type="number"
                      value={clinicalData.temperature}
                      onChange={(e) => setClinicalData({ ...clinicalData, temperature: Number(e.target.value) })}
                      max={constants.MAX_TEMP_C * 10}
                    />
                    <p className="text-xs text-gray-500">37.0°C = 370</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Oxygen Saturation (%)</Label>
                    <Input
                      type="number"
                      value={clinicalData.oxygenSat}
                      onChange={(e) => setClinicalData({ ...clinicalData, oxygenSat: Number(e.target.value) })}
                      max={constants.MAX_O2_SAT}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pain Level (0-10)</Label>
                    <Input
                      type="number"
                      value={clinicalData.clinicalPainLevel}
                      onChange={(e) => setClinicalData({ ...clinicalData, clinicalPainLevel: Number(e.target.value) })}
                      max={constants.MAX_PAIN}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>ESI Triage Level (1=Critical, 5=Non-Urgent)</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <Button
                        key={level}
                        variant={clinicalData.esiLevel === level ? "default" : "outline"}
                        onClick={() => setClinicalData({ ...clinicalData, esiLevel: level })}
                        className={
                          level === 1 ? "bg-red-600 hover:bg-red-700" :
                          level === 2 ? "bg-orange-600 hover:bg-orange-700" :
                          level === 3 ? "bg-yellow-600 hover:bg-yellow-700" :
                          level === 4 ? "bg-green-600 hover:bg-green-700" :
                          "bg-blue-600 hover:bg-blue-700"
                        }
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Calculated Risk Score</div>
                  <div className="text-3xl font-bold text-purple-600">{clinicalRiskScore}/100</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Based on vital signs and ESI level
                  </div>
                </div>

                <Separator />

                <Button
                  onClick={handleClinicalSubmit}
                  disabled={!isOwner}
                  className="w-full"
                >
                  Submit Clinical Assessment
                </Button>

                {clinicalStatus && (
                  <div className="bg-gray-100 p-3 rounded text-sm">{clinicalStatus}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== Public Statistics Tab ========== */}
          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Public Statistics</CardTitle>
                <p className="text-sm text-gray-600">
                  View aggregated stats from closed epochs (KMS decrypted)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Epoch ID to View</Label>
                  <Input
                    type="number"
                    value={viewEpochId}
                    onChange={(e) => setViewEpochId(Number(e.target.value))}
                    max={epochId}
                  />
                  <p className="text-xs text-gray-500">Current epoch: {epochId}</p>
                </div>

                {stats && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">Patient Sum</div>
                        <div className="text-2xl font-bold text-blue-600">{stats.patientSum}</div>
                        <div className="text-xs text-gray-500">Count: {stats.patientCount}</div>
                        <div className="text-xs text-gray-500">Avg: {stats.patientAvg}</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600">Provider Sum</div>
                        <div className="text-2xl font-bold text-purple-600">{stats.providerSum}</div>
                        <div className="text-xs text-gray-500">Count: {stats.providerCount}</div>
                        <div className="text-xs text-gray-500">Avg: {stats.providerAvg}</div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Closed at: {new Date(stats.closedAt * 1000).toLocaleString()}
                    </div>
                  </div>
                )}

                {!stats && <p className="text-gray-500">Epoch not finalized yet</p>}

                <Separator />

                <div className="space-y-2">
                  <Button onClick={handleCloseEpoch} className="w-full">
                    Close Current Epoch (Permissionless)
                  </Button>
                  <p className="text-xs text-gray-500">
                    Anyone can close the current epoch. Requires KMS oracle to finalize.
                  </p>
                  {epochStatus && (
                    <div className="bg-gray-100 p-3 rounded text-sm">{epochStatus}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== Admin Controls Tab ========== */}
          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Admin Controls (Owner Only)</CardTitle>
                <p className="text-sm text-gray-600">
                  Manage contract settings and authorized researchers
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isOwner && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                    <p className="text-yellow-800">Only the contract owner can access admin controls.</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Contract Owner</Label>
                  <div className="font-mono text-sm bg-gray-100 p-3 rounded">{owner || "Loading..."}</div>
                </div>

                <div className="space-y-2">
                  <Label>Authorized Researcher</Label>
                  <div className="font-mono text-sm bg-gray-100 p-3 rounded">
                    {researcher === "0x0000000000000000000000000000000000000000" ? "None" : researcher || "Loading..."}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Authorize New Researcher</Label>
                  <Input
                    placeholder="0x..."
                    value={researcherAddress}
                    onChange={(e) => setResearcherAddress(e.target.value)}
                    disabled={!isOwner}
                  />
                  <Button
                    onClick={handleAuthorizeResearcher}
                    disabled={!isOwner}
                    className="w-full"
                  >
                    Authorize Researcher
                  </Button>
                  {adminStatus && (
                    <div className="bg-gray-100 p-3 rounded text-sm">{adminStatus}</div>
                  )}
                </div>

                <Separator />

                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold">Contract Constants</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>MAX_RISK_SCORE: {constants.MAX_RISK_SCORE}</div>
                    <div>MAX_BP: {constants.MAX_BP} mmHg</div>
                    <div>MAX_HEART_RATE: {constants.MAX_HEART_RATE} bpm</div>
                    <div>MAX_TEMP_C: {constants.MAX_TEMP_C} (°C × 10)</div>
                    <div>MAX_O2_SAT: {constants.MAX_O2_SAT}%</div>
                    <div>MAX_PAIN: {constants.MAX_PAIN}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
