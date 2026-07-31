"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  useSubmitHealthData,
  useDecryptPatientError,
  useClosePublicStatsEpoch,
  useRequestAggregateDecryption,
  useAuthorizeResearcher,
  useSubmitHealthDataBatch,
} from "@/app/hooks/useHealthData";
import { ADDR } from "@/lib/addresses";
import { healthDataAggregatorAbi } from "@/lib/abis";

// Medical Risk Score Calculator based on SAMPLE framework + ESI triage
function calculateRiskScore(data: PatientAssessment): number {
  let score = 0;

  // Symptoms severity (0-30 points)
  const symptomCount = data.symptoms.length;
  score += Math.min(symptomCount * 5, 30);

  // Pain score contribution (0-20 points)
  score += data.painLevel * 2;

  // Duration urgency (0-15 points)
  if (data.durationHours < 2) score += 15;
  else if (data.durationHours < 24) score += 10;
  else if (data.durationHours < 168) score += 5;

  // Chronic conditions (0-15 points)
  score += Math.min(data.chronicConditions.length * 5, 15);

  // Allergies flag (0-5 points)
  if (data.allergies.length > 0) score += 5;

  // Medications count (0-10 points)
  score += Math.min(data.medications * 2, 10);

  // Vital signs abnormality (0-5 points)
  if (data.hasAbnormalVitals) score += 5;

  return Math.min(Math.round(score), 100);
}

interface PatientAssessment {
  symptoms: string[];
  painLevel: number;
  durationHours: number;
  chronicConditions: string[];
  allergies: string[];
  medications: number;
  hasAbnormalVitals: boolean;
}

interface ProviderAssessment {
  patientAddress: string;
  triageLevel: number; // ESI 1-5
  systolicBP: number;
  diastolicBP: number;
  heartRate: number;
  temperature: number;
  oxygenSat: number;
  painScore: number;
  diagnosisCode: string;
}

export default function HealthAggregateContent() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  // Patient self-assessment state
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [painLevel, setPainLevel] = useState(0);
  const [durationHours, setDurationHours] = useState(0);
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [medicationsCount, setMedicationsCount] = useState(0);

  // Provider assessment state
  const [providerPatients, setProviderPatients] = useState<ProviderAssessment[]>([
    {
      patientAddress: "",
      triageLevel: 3,
      systolicBP: 120,
      diastolicBP: 80,
      heartRate: 75,
      temperature: 37.0,
      oxygenSat: 98,
      painScore: 0,
      diagnosisCode: "",
    },
  ]);

  const [status, setStatus] = useState("");
  const [researcherAddress, setResearcherAddress] = useState("");
  const [epochToView, setEpochToView] = useState("0");

  // Hooks
  const { submitHealthData } = useSubmitHealthData();
  const { submitBatch } = useSubmitHealthDataBatch();
  const { closeEpoch } = useClosePublicStatsEpoch();
  const { requestDecryption } = useRequestAggregateDecryption();
  const { authorizeResearcher } = useAuthorizeResearcher();

  // Read contract state
  const { data: submissionCount } = useReadContract({
    address: ADDR.healthDataAggregator as `0x${string}`,
    abi: healthDataAggregatorAbi,
    functionName: "submissionCount",
  });

  const { data: hasSubmitted } = useReadContract({
    address: ADDR.healthDataAggregator as `0x${string}`,
    abi: healthDataAggregatorAbi,
    functionName: "hasPatientSubmitted",
    args: address ? [address] : undefined,
  });

  const { data: patientError } = useReadContract({
    address: ADDR.healthDataAggregator as `0x${string}`,
    abi: healthDataAggregatorAbi,
    functionName: "getPatientError",
    args: address ? [address] : undefined,
  });

  const { data: currentEpochId } = useReadContract({
    address: ADDR.healthDataAggregator as `0x${string}`,
    abi: healthDataAggregatorAbi,
    functionName: "currentEpochId",
  });

  const { data: publicStats } = useReadContract({
    address: ADDR.healthDataAggregator as `0x${string}`,
    abi: healthDataAggregatorAbi,
    functionName: "getPublicStats",
    args: [BigInt(epochToView)],
  });

  const { data: contractOwner } = useReadContract({
    address: ADDR.healthDataAggregator as `0x${string}`,
    abi: healthDataAggregatorAbi,
    functionName: "owner",
  });

  const { data: authorizedResearcherAddr } = useReadContract({
    address: ADDR.healthDataAggregator as `0x${string}`,
    abi: healthDataAggregatorAbi,
    functionName: "authorizedResearcher",
  });

  const { decryptError, errorLabel, isDecrypting } = useDecryptPatientError(
    patientError as `0x${string}` | undefined
  );

  // Check permissions
  const isOwner = address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase();
  const isResearcher =
    address &&
    authorizedResearcherAddr &&
    address.toLowerCase() === authorizedResearcherAddr.toLowerCase();

  // Calculate risk score from patient inputs
  const calculatedRiskScore = calculateRiskScore({
    symptoms,
    painLevel,
    durationHours,
    chronicConditions,
    allergies,
    medications: medicationsCount,
    hasAbnormalVitals: false,
  });

  // Patient submission handler
  const handlePatientSubmit = async () => {
    try {
      setStatus("Encrypting & submitting health assessment...");
      const hash = await submitHealthData(calculatedRiskScore);
      setStatus(`Success! TX: ${hash.slice(0, 20)}...`);

      // Reset form
      setSymptoms([]);
      setPainLevel(0);
      setDurationHours(0);
      setChronicConditions([]);
      setAllergies([]);
      setMedicationsCount(0);
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  // Provider batch submission handler
  const handleProviderSubmit = async () => {
    try {
      setStatus("Encrypting batch health data...");

      const patients = providerPatients.map((p) => p.patientAddress as `0x${string}`);
      const riskScores = providerPatients.map((p) => {
        // Calculate composite risk from clinical data
        let score = 0;

        // ESI Triage (inverted: 1=critical=high score, 5=non-urgent=low score)
        score += (6 - p.triageLevel) * 15; // 15-75 points

        // Vital signs scoring
        if (p.systolicBP > 140 || p.systolicBP < 90) score += 5;
        if (p.diastolicBP > 90 || p.diastolicBP < 60) score += 5;
        if (p.heartRate > 100 || p.heartRate < 60) score += 5;
        if (p.temperature > 38 || p.temperature < 36) score += 5;
        if (p.oxygenSat < 95) score += 10;

        // Pain contribution
        score += p.painScore;

        return Math.min(Math.round(score), 100);
      });

      const hash = await submitBatch(patients, riskScores);
      setStatus(`Batch submitted! TX: ${hash.slice(0, 20)}...`);

      // Reset form
      setProviderPatients([
        {
          patientAddress: "",
          triageLevel: 3,
          systolicBP: 120,
          diastolicBP: 80,
          heartRate: 75,
          temperature: 37.0,
          oxygenSat: 98,
          painScore: 0,
          diagnosisCode: "",
        },
      ]);
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  // Symptom options based on common triage categories
  const commonSymptoms = [
    "Fever / Chills",
    "Cough",
    "Difficulty Breathing",
    "Chest Pain",
    "Headache",
    "Nausea / Vomiting",
    "Abdominal Pain",
    "Dizziness",
    "Weakness / Fatigue",
    "Confusion",
  ];

  const chronicConditionOptions = [
    "Diabetes",
    "Hypertension",
    "Asthma / COPD",
    "Heart Disease",
    "Kidney Disease",
    "Cancer",
  ];

  const allergyOptions = [
    "Penicillin",
    "Sulfa drugs",
    "Aspirin / NSAIDs",
    "Latex",
    "Shellfish",
    "Nuts",
  ];

  const toggleSymptom = (symptom: string) => {
    setSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const toggleCondition = (condition: string) => {
    setChronicConditions((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
    );
  };

  const toggleAllergy = (allergy: string) => {
    setAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">APU Health Platform</CardTitle>
            <p className="text-sm text-gray-600 text-center mt-2">
              Privacy-preserving health data aggregation with FHE
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={openConnectModal} className="w-full bg-indigo-600 hover:bg-indigo-700">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl">APU Health Platform</CardTitle>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Connected: {address?.slice(0, 10)}...{address?.slice(-8)}</p>
              <p>Total Submissions: {submissionCount?.toString() || "0"}</p>
              <p>Current Epoch: {currentEpochId?.toString() || "0"}</p>
              {isOwner && <p className="text-indigo-600 font-semibold">Role: Contract Owner</p>}
              {isResearcher && <p className="text-green-600 font-semibold">Role: Authorized Researcher</p>}
            </div>
          </CardHeader>
        </Card>

        {/* Main Interface */}
        <Tabs defaultValue="patient" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow">
            <TabsTrigger value="patient">Patient</TabsTrigger>
            <TabsTrigger value="provider" disabled={!isOwner}>
              Provider
            </TabsTrigger>
            <TabsTrigger value="stats">Public Stats</TabsTrigger>
            <TabsTrigger value="researcher" disabled={!isResearcher}>
              Researcher
            </TabsTrigger>
            <TabsTrigger value="admin" disabled={!isOwner}>
              Admin
            </TabsTrigger>
          </TabsList>

          {/* Patient Self-Assessment Tab */}
          <TabsContent value="patient">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Patient Health Self-Assessment</CardTitle>
                <p className="text-sm text-gray-600">
                  Based on SAMPLE medical framework. Your data is encrypted client-side before submission.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Symptoms */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Signs & Symptoms - What are you experiencing?
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {commonSymptoms.map((symptom) => (
                      <div key={symptom} className="flex items-center space-x-2">
                        <Checkbox
                          id={symptom}
                          checked={symptoms.includes(symptom)}
                          onCheckedChange={() => toggleSymptom(symptom)}
                        />
                        <label htmlFor={symptom} className="text-sm cursor-pointer">
                          {symptom}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pain Level */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Pain Level (0 = No pain, 10 = Worst imaginable)
                  </Label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={painLevel}
                      onChange={(e) => setPainLevel(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-2xl font-bold w-12 text-center">{painLevel}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>No Pain</span>
                    <span>Mild</span>
                    <span>Moderate</span>
                    <span>Severe</span>
                    <span>Worst</span>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    How long have you had these symptoms?
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant={durationHours === 1 ? "default" : "outline"}
                      onClick={() => setDurationHours(1)}
                      className="text-xs"
                    >
                      &lt; 2 hours
                    </Button>
                    <Button
                      variant={durationHours === 12 ? "default" : "outline"}
                      onClick={() => setDurationHours(12)}
                      className="text-xs"
                    >
                      2-24 hours
                    </Button>
                    <Button
                      variant={durationHours === 72 ? "default" : "outline"}
                      onClick={() => setDurationHours(72)}
                      className="text-xs"
                    >
                      1-7 days
                    </Button>
                    <Button
                      variant={durationHours === 240 ? "default" : "outline"}
                      onClick={() => setDurationHours(240)}
                      className="text-xs"
                    >
                      &gt; 7 days
                    </Button>
                  </div>
                </div>

                {/* Chronic Conditions */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Past Medical History - Do you have any of these chronic conditions?
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {chronicConditionOptions.map((condition) => (
                      <div key={condition} className="flex items-center space-x-2">
                        <Checkbox
                          id={condition}
                          checked={chronicConditions.includes(condition)}
                          onCheckedChange={() => toggleCondition(condition)}
                        />
                        <label htmlFor={condition} className="text-sm cursor-pointer">
                          {condition}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Allergies */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Allergies - Do you have any known allergies?
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {allergyOptions.map((allergy) => (
                      <div key={allergy} className="flex items-center space-x-2">
                        <Checkbox
                          id={allergy}
                          checked={allergies.includes(allergy)}
                          onCheckedChange={() => toggleAllergy(allergy)}
                        />
                        <label htmlFor={allergy} className="text-sm cursor-pointer">
                          {allergy}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Medications - How many medications are you currently taking?
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={medicationsCount}
                    onChange={(e) => setMedicationsCount(Number(e.target.value))}
                    placeholder="Number of medications"
                  />
                </div>

                {/* Calculated Risk Score Display */}
                <div className="border-t pt-4">
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                      Calculated Health Risk Score (based on your inputs):
                    </p>
                    <p className="text-4xl font-bold text-indigo-600">{calculatedRiskScore}/100</p>
                    <p className="text-xs text-gray-500 mt-2">
                      This score combines your symptoms, pain level, duration, medical history, allergies, and
                      medications into a single encrypted value.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handlePatientSubmit}
                  disabled={hasSubmitted || symptoms.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {hasSubmitted ? "Already Submitted" : "Submit Encrypted Health Assessment"}
                </Button>

                {hasSubmitted && patientError && (
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 rounded text-sm">
                      <p className="font-medium">Submission Status: Recorded</p>
                      {errorLabel ? (
                        <p className="text-gray-600">Error Flag: {errorLabel}</p>
                      ) : (
                        <Button
                          onClick={decryptError}
                          disabled={isDecrypting}
                          size="sm"
                          variant="outline"
                          className="mt-2"
                        >
                          {isDecrypting ? "Decrypting..." : "Decrypt Error Flag"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {status && (
                  <div className="p-3 bg-gray-100 rounded text-sm break-all">
                    {status}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Healthcare Provider Tab */}
          <TabsContent value="provider">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Healthcare Provider Dashboard</CardTitle>
                <p className="text-sm text-gray-600">
                  Clinical assessment and batch patient data submission (ESI-based triage)
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Emergency Severity Index (ESI) Reference:</p>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <div className="p-2 bg-red-600 text-white rounded text-center">
                      <div className="font-bold">ESI 1</div>
                      <div className="mt-1">Critical</div>
                    </div>
                    <div className="p-2 bg-orange-500 text-white rounded text-center">
                      <div className="font-bold">ESI 2</div>
                      <div className="mt-1">Emergency</div>
                    </div>
                    <div className="p-2 bg-yellow-500 text-white rounded text-center">
                      <div className="font-bold">ESI 3</div>
                      <div className="mt-1">Urgent</div>
                    </div>
                    <div className="p-2 bg-green-500 text-white rounded text-center">
                      <div className="font-bold">ESI 4</div>
                      <div className="mt-1">Semi-Urgent</div>
                    </div>
                    <div className="p-2 bg-blue-500 text-white rounded text-center">
                      <div className="font-bold">ESI 5</div>
                      <div className="mt-1">Non-Urgent</div>
                    </div>
                  </div>
                </div>

                {providerPatients.map((patient, index) => (
                  <Card key={index} className="border-2 border-indigo-200">
                    <CardHeader className="bg-indigo-50">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Patient {index + 1}</CardTitle>
                        {providerPatients.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setProviderPatients(providerPatients.filter((_, i) => i !== index));
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      {/* Patient Address */}
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">
                          Patient Wallet Address
                        </Label>
                        <Input
                          type="text"
                          value={patient.patientAddress}
                          onChange={(e) => {
                            const updated = [...providerPatients];
                            updated[index].patientAddress = e.target.value;
                            setProviderPatients(updated);
                          }}
                          placeholder="0x..."
                          className="w-full font-mono text-sm"
                        />
                      </div>

                      {/* ESI Triage Level */}
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">
                          ESI Triage Level
                        </Label>
                        <div className="grid grid-cols-5 gap-2">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <Button
                              key={level}
                              variant={patient.triageLevel === level ? "default" : "outline"}
                              onClick={() => {
                                const updated = [...providerPatients];
                                updated[index].triageLevel = level;
                                setProviderPatients(updated);
                              }}
                              className={
                                patient.triageLevel === level
                                  ? level === 1
                                    ? "bg-red-600 hover:bg-red-700"
                                    : level === 2
                                    ? "bg-orange-500 hover:bg-orange-600"
                                    : level === 3
                                    ? "bg-yellow-500 hover:bg-yellow-600"
                                    : level === 4
                                    ? "bg-green-500 hover:bg-green-600"
                                    : "bg-blue-500 hover:bg-blue-600"
                                  : ""
                              }
                            >
                              {level}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Vital Signs Grid */}
                      <div>
                        <Label className="text-sm font-semibold mb-3 block">Vital Signs</Label>
                        <div className="grid grid-cols-2 gap-4">
                          {/* Blood Pressure */}
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                              Systolic BP (mmHg)
                            </label>
                            <Input
                              type="number"
                              min="60"
                              max="200"
                              value={patient.systolicBP}
                              onChange={(e) => {
                                const updated = [...providerPatients];
                                updated[index].systolicBP = Number(e.target.value);
                                setProviderPatients(updated);
                              }}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                              Diastolic BP (mmHg)
                            </label>
                            <Input
                              type="number"
                              min="40"
                              max="130"
                              value={patient.diastolicBP}
                              onChange={(e) => {
                                const updated = [...providerPatients];
                                updated[index].diastolicBP = Number(e.target.value);
                                setProviderPatients(updated);
                              }}
                              className="w-full"
                            />
                          </div>

                          {/* Heart Rate */}
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                              Heart Rate (bpm)
                            </label>
                            <Input
                              type="number"
                              min="40"
                              max="200"
                              value={patient.heartRate}
                              onChange={(e) => {
                                const updated = [...providerPatients];
                                updated[index].heartRate = Number(e.target.value);
                                setProviderPatients(updated);
                              }}
                              className="w-full"
                            />
                          </div>

                          {/* Temperature */}
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                              Temperature (°C)
                            </label>
                            <Input
                              type="number"
                              step="0.1"
                              min="35"
                              max="42"
                              value={patient.temperature}
                              onChange={(e) => {
                                const updated = [...providerPatients];
                                updated[index].temperature = Number(e.target.value);
                                setProviderPatients(updated);
                              }}
                              className="w-full"
                            />
                          </div>

                          {/* Oxygen Saturation */}
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                              O2 Saturation (%)
                            </label>
                            <Input
                              type="number"
                              min="70"
                              max="100"
                              value={patient.oxygenSat}
                              onChange={(e) => {
                                const updated = [...providerPatients];
                                updated[index].oxygenSat = Number(e.target.value);
                                setProviderPatients(updated);
                              }}
                              className="w-full"
                            />
                          </div>

                          {/* Pain Score */}
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                              Pain Score (0-10)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              value={patient.painScore}
                              onChange={(e) => {
                                const updated = [...providerPatients];
                                updated[index].painScore = Number(e.target.value);
                                setProviderPatients(updated);
                              }}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Diagnosis Code (Optional) */}
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">
                          Diagnosis Code (ICD-10) - Optional
                        </Label>
                        <Input
                          type="text"
                          value={patient.diagnosisCode}
                          onChange={(e) => {
                            const updated = [...providerPatients];
                            updated[index].diagnosisCode = e.target.value;
                            setProviderPatients(updated);
                          }}
                          placeholder="e.g., J44.0 (COPD)"
                          className="w-full"
                        />
                      </div>

                      {/* Calculated Risk Preview */}
                      <div className="border-t pt-3">
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-600 mb-1">Calculated Risk Score:</p>
                          <p className="text-2xl font-bold text-indigo-600">
                            {(() => {
                              let score = 0;
                              score += (6 - patient.triageLevel) * 15;
                              if (patient.systolicBP > 140 || patient.systolicBP < 90) score += 5;
                              if (patient.diastolicBP > 90 || patient.diastolicBP < 60) score += 5;
                              if (patient.heartRate > 100 || patient.heartRate < 60) score += 5;
                              if (patient.temperature > 38 || patient.temperature < 36) score += 5;
                              if (patient.oxygenSat < 95) score += 10;
                              score += patient.painScore;
                              return Math.min(Math.round(score), 100);
                            })()}
                            /100
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Add Patient Button */}
                <Button
                  variant="outline"
                  onClick={() => {
                    if (providerPatients.length < 10) {
                      setProviderPatients([
                        ...providerPatients,
                        {
                          patientAddress: "",
                          triageLevel: 3,
                          systolicBP: 120,
                          diastolicBP: 80,
                          heartRate: 75,
                          temperature: 37.0,
                          oxygenSat: 98,
                          painScore: 0,
                          diagnosisCode: "",
                        },
                      ]);
                    }
                  }}
                  disabled={providerPatients.length >= 10}
                  className="w-full border-dashed border-2"
                >
                  + Add Another Patient (Max 10)
                </Button>

                {/* Submit Batch Button */}
                <Button
                  onClick={handleProviderSubmit}
                  disabled={providerPatients.some((p) => !p.patientAddress)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base"
                >
                  Submit Batch ({providerPatients.length} patient{providerPatients.length !== 1 ? "s" : ""})
                </Button>

                {status && (
                  <div className="p-3 bg-gray-100 rounded text-sm break-all">
                    {status}
                  </div>
                )}

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm font-medium mb-2">⚠️ Important Notes:</p>
                  <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                    <li>All patient data is encrypted client-side before submission</li>
                    <li>Each patient can only be submitted once (wallet-based deduplication)</li>
                    <li>Risk scores are calculated from ESI level + vital signs + pain</li>
                    <li>Individual records remain encrypted - only aggregates are decryptable</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Public Stats Tab - Keep existing */}
          <TabsContent value="stats">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Public Statistics</CardTitle>
                <p className="text-sm text-gray-600">
                  View aggregated statistics from closed epochs (permissionless)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Epoch ID to View</label>
                  <Input
                    type="number"
                    min="0"
                    value={epochToView}
                    onChange={(e) => setEpochToView(e.target.value)}
                    placeholder="Enter epoch ID"
                    className="w-full"
                  />
                </div>

                {publicStats && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <p className="text-sm text-gray-600">Total Sum</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {publicStats[0]?.toString() || "N/A"}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <p className="text-sm text-gray-600">Average</p>
                      <p className="text-2xl font-bold text-green-700">
                        {publicStats[1]?.toString() || "N/A"}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <p className="text-sm text-gray-600">Sample Count</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {publicStats[2]?.toString() || "N/A"}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                      <p className="text-sm text-gray-600">Closed At</p>
                      <p className="text-lg font-bold text-orange-700">
                        {publicStats[3]
                          ? new Date(Number(publicStats[3]) * 1000).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-600 mb-3">Anyone can close the current epoch:</p>
                  <Button onClick={async () => {
                    try {
                      setStatus("Closing current epoch...");
                      const hash = await closeEpoch();
                      setStatus(`Epoch closed! TX: ${hash.slice(0, 20)}...`);
                    } catch (error: any) {
                      setStatus(`Error: ${error.message}`);
                    }
                  }} className="w-full" variant="outline">
                    Close Current Epoch (Permissionless)
                  </Button>
                </div>

                {status && (
                  <div className="p-3 bg-gray-100 rounded text-sm break-all">
                    {status}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Researcher & Admin tabs - keep existing code */}
          <TabsContent value="researcher">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Researcher Dashboard</CardTitle>
                <p className="text-sm text-gray-600">
                  Request aggregate decryption (authorized researchers only)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Authorized Researcher</p>
                  <p className="text-sm font-mono mt-1">
                    {authorizedResearcherAddr || "None"}
                  </p>
                </div>

                <Button
                  onClick={async () => {
                    try {
                      setStatus("Requesting aggregate decryption...");
                      const hash = await requestDecryption();
                      setStatus(`Decryption requested! TX: ${hash.slice(0, 20)}...`);
                    } catch (error: any) {
                      setStatus(`Error: ${error.message}`);
                    }
                  }}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!isResearcher}
                >
                  Request Aggregate Decryption
                </Button>

                <div className="p-3 bg-blue-50 rounded text-sm">
                  <p className="font-medium mb-2">Note:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Only authorized researcher can request decryption</li>
                    <li>Decryption reveals aggregate sum only</li>
                    <li>Individual records remain encrypted forever</li>
                  </ul>
                </div>

                {status && (
                  <div className="p-3 bg-gray-100 rounded text-sm break-all">
                    {status}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Admin Controls</CardTitle>
                <p className="text-sm text-gray-600">Contract owner management (owner only)</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-gray-600">Contract Owner</p>
                  <p className="text-sm font-mono mt-1">{contractOwner}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Authorize Researcher</label>
                  <Input
                    type="text"
                    value={researcherAddress}
                    onChange={(e) => setResearcherAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full mb-2"
                  />
                  <Button
                    onClick={async () => {
                      try {
                        setStatus("Authorizing researcher...");
                        const hash = await authorizeResearcher(researcherAddress as `0x${string}`);
                        setStatus(`Researcher authorized! TX: ${hash.slice(0, 20)}...`);
                        setResearcherAddress("");
                      } catch (error: any) {
                        setStatus(`Error: ${error.message}`);
                      }
                    }}
                    disabled={!researcherAddress || !isOwner}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    Authorize Researcher
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Current Authorized Researcher:</p>
                  <p className="text-sm font-mono p-3 bg-gray-100 rounded">
                    {authorizedResearcherAddr || "None"}
                  </p>
                </div>

                {status && (
                  <div className="p-3 bg-gray-100 rounded text-sm break-all">
                    {status}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Footer */}
        <Card className="shadow-lg bg-gradient-to-r from-indigo-50 to-blue-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">How APU Preserves Privacy:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ Health data encrypted on your device using SAMPLE medical framework</li>
              <li>✓ Contract computes on encrypted data using Fully Homomorphic Encryption</li>
              <li>✓ Only aggregate statistics (sum, average, count) can be decrypted</li>
              <li>✓ Your individual assessment remains encrypted forever - unbreakable privacy</li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              Contract: {ADDR.healthDataAggregator}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
