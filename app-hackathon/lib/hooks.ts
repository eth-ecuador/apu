/**
 * Custom hooks for HealthDataAggregator contract
 * Pattern from ghostlend mainnet-s3 winner
 */

"use client";

import { useReadContract } from "wagmi";
import { ADDR } from "./addresses";
import { healthDataAggregatorAbi, medicalRecordsV2Abi } from "./abis";

const CONTRACT = {
  address: ADDR.healthDataAggregator as `0x${string}`,
  abi: healthDataAggregatorAbi,
};

/**
 * Get submission count (public plaintext value)
 */
export function useSubmissionCount() {
  const { data, refetch } = useReadContract({
    ...CONTRACT,
    functionName: "submissionCount",
    query: { refetchInterval: 10000 },
  });

  return {
    count: data != null ? Number(data) : 0,
    refetch,
  };
}

/**
 * Check if a patient has submitted
 */
export function useHasPatientSubmitted(patientAddress?: string) {
  const { data } = useReadContract({
    ...CONTRACT,
    functionName: "hasPatientSubmitted",
    args: patientAddress ? [patientAddress as `0x${string}`] : undefined,
    query: { enabled: !!patientAddress, refetchInterval: 10000 },
  });

  return data ?? false;
}

/**
 * Get authorized researcher address
 */
export function useAuthorizedResearcher() {
  const { data } = useReadContract({
    ...CONTRACT,
    functionName: "authorizedResearcher",
    query: { refetchInterval: 15000 },
  });

  return data as string | undefined;
}

/**
 * Get contract owner
 */
export function useContractOwner() {
  const { data } = useReadContract({
    ...CONTRACT,
    functionName: "owner",
  });

  return data as string | undefined;
}

/**
 * Get patient's encrypted error flag handle
 */
export function usePatientError(patientAddress?: string) {
  const { data, refetch } = useReadContract({
    ...CONTRACT,
    functionName: "getPatientError",
    args: patientAddress ? [patientAddress as `0x${string}`] : undefined,
    query: { enabled: !!patientAddress, refetchInterval: 10000 },
  });

  return {
    errorHandle: data as `0x${string}` | undefined,
    refetch,
  };
}

/**
 * Get patient's submission nonce
 */
export function usePatientNonce(patientAddress?: string) {
  const { data } = useReadContract({
    ...CONTRACT,
    functionName: "getPatientNonce",
    args: patientAddress ? [patientAddress as `0x${string}`] : undefined,
    query: { enabled: !!patientAddress },
  });

  return data != null ? Number(data) : 0;
}

/**
 * Get current epoch ID
 */
export function useCurrentEpochId() {
  const { data, refetch } = useReadContract({
    ...CONTRACT,
    functionName: "currentEpochId",
    query: { refetchInterval: 10000 },
  });

  return {
    epochId: data != null ? Number(data) : 0,
    refetch,
  };
}

/**
 * Get public statistics for a finalized epoch
 */
export function usePublicStats(epochId: number) {
  const { data, refetch } = useReadContract({
    ...CONTRACT,
    functionName: "getPublicStats",
    args: [BigInt(epochId)],
    query: { refetchInterval: 10000 },
  });

  if (!data) return null;

  const [sum, average, count, closedAt] = data as [number, number, bigint, number];

  return {
    sum: Number(sum),
    average: Number(average),
    count: Number(count),
    closedAt: Number(closedAt),
    refetch,
  };
}

/**
 * Get MAX_HEALTH_VALUE constant
 */
export function useMaxHealthValue() {
  const { data } = useReadContract({
    ...CONTRACT,
    functionName: "MAX_HEALTH_VALUE",
  });

  return data != null ? Number(data) : 100;
}

// =============================================================================
// MedicalRecordsV2 Hooks
// =============================================================================

const MEDICAL_V2_CONTRACT = {
  address: ADDR.medicalRecordsV2 as `0x${string}`,
  abi: medicalRecordsV2Abi,
};

/**
 * Get current submission counts (patient, provider, total)
 */
export function useCurrentCounts() {
  const { data, refetch } = useReadContract({
    ...MEDICAL_V2_CONTRACT,
    functionName: "getCurrentCounts",
    query: { refetchInterval: 10000 },
  });

  if (!data) {
    return { patientCount: 0, providerCount: 0, totalCount: 0, refetch };
  }

  const [patientCount, providerCount, totalCount] = data as [bigint, bigint, bigint];

  return {
    patientCount: Number(patientCount),
    providerCount: Number(providerCount),
    totalCount: Number(totalCount),
    refetch,
  };
}

/**
 * Check if a patient has submitted (either self-report or clinical assessment)
 */
export function useHasSubmittedV2(patientAddress?: string) {
  const { data } = useReadContract({
    ...MEDICAL_V2_CONTRACT,
    functionName: "hasSubmitted",
    args: patientAddress ? [patientAddress as `0x${string}`] : undefined,
    query: { enabled: !!patientAddress, refetchInterval: 10000 },
  });

  return data ?? false;
}

/**
 * Get data source for a patient (0 = patient, 1 = provider)
 */
export function useDataSource(patientAddress?: string) {
  const { data } = useReadContract({
    ...MEDICAL_V2_CONTRACT,
    functionName: "getDataSource",
    args: patientAddress ? [patientAddress as `0x${string}`] : undefined,
    query: { enabled: !!patientAddress, refetchInterval: 10000 },
  });

  return data != null ? Number(data) : null;
}

/**
 * Get patient's encrypted error flag handle
 */
export function usePatientErrorFlagV2(patientAddress?: string) {
  const { data, refetch } = useReadContract({
    ...MEDICAL_V2_CONTRACT,
    functionName: "getPatientErrorFlag",
    args: patientAddress ? [patientAddress as `0x${string}`] : undefined,
    query: { enabled: !!patientAddress, refetchInterval: 10000 },
  });

  return {
    errorHandle: data as `0x${string}` | undefined,
    refetch,
  };
}

/**
 * Get authorized researcher address for MedicalRecordsV2
 */
export function useAuthorizedResearcherV2() {
  const { data } = useReadContract({
    ...MEDICAL_V2_CONTRACT,
    functionName: "authorizedResearcher",
    query: { refetchInterval: 15000 },
  });

  return data as string | undefined;
}

/**
 * Get contract owner for MedicalRecordsV2
 */
export function useContractOwnerV2() {
  const { data } = useReadContract({
    ...MEDICAL_V2_CONTRACT,
    functionName: "owner",
  });

  return data as string | undefined;
}

/**
 * Check if a doctor is authorized to access a patient's records
 */
export function useIsDoctorAuthorized(
  patientAddress?: `0x${string}`,
  doctorAddress?: `0x${string}`
) {
  const { data, refetch } = useReadContract({
    ...MEDICAL_V2_CONTRACT,
    functionName: "isDoctorAuthorized",
    args: patientAddress && doctorAddress ? [patientAddress, doctorAddress] : undefined,
    query: {
      enabled: !!patientAddress && !!doctorAddress,
      refetchInterval: 5000,
    },
  });

  return { isAuthorized: data as boolean | undefined, refetch };
}

/**
 * Get current epoch ID for MedicalRecordsV2
 */
export function useCurrentEpochIdV2() {
  const { data, refetch } = useReadContract({
    ...MEDICAL_V2_CONTRACT,
    functionName: "currentEpochId",
    query: { refetchInterval: 10000 },
  });

  return {
    epochId: data != null ? Number(data) : 0,
    refetch,
  };
}

/**
 * Get public statistics for a finalized epoch (MedicalRecordsV2)
 * Returns separate patient and provider aggregates
 */
export function usePublicStatsV2(epochId: number) {
  const { data, refetch } = useReadContract({
    ...MEDICAL_V2_CONTRACT,
    functionName: "getPublicStats",
    args: [BigInt(epochId)],
    query: { refetchInterval: 10000 },
  });

  if (!data) return null;

  const [patientSum, providerSum, patientAvg, providerAvg, patientCount, providerCount, closedAt] = data as [
    number,
    number,
    number,
    number,
    bigint,
    bigint,
    number
  ];

  return {
    patientSum: Number(patientSum),
    providerSum: Number(providerSum),
    patientAvg: Number(patientAvg),
    providerAvg: Number(providerAvg),
    patientCount: Number(patientCount),
    providerCount: Number(providerCount),
    closedAt: Number(closedAt),
    refetch,
  };
}

/**
 * Get MAX constants for MedicalRecordsV2
 */
export function useMedicalConstants() {
  const { data: maxRiskScore } = useReadContract({
    ...MEDICAL_V2_CONTRACT,
    functionName: "MAX_RISK_SCORE",
  });

  const { data: maxBP } = useReadContract({
    ...MEDICAL_V2_CONTRACT,
    functionName: "MAX_BP",
  });

  const { data: maxHeartRate } = useReadContract({
    ...MEDICAL_V2_CONTRACT,
    functionName: "MAX_HEART_RATE",
  });

  const { data: maxTempC } = useReadContract({
    ...MEDICAL_V2_CONTRACT,
    functionName: "MAX_TEMP_C",
  });

  const { data: maxO2Sat } = useReadContract({
    ...MEDICAL_V2_CONTRACT,
    functionName: "MAX_O2_SAT",
  });

  const { data: maxPain } = useReadContract({
    ...MEDICAL_V2_CONTRACT,
    functionName: "MAX_PAIN",
  });

  const { data: sourcePatient } = useReadContract({
    ...MEDICAL_V2_CONTRACT,
    functionName: "SOURCE_PATIENT",
  });

  const { data: sourceProvider } = useReadContract({
    ...MEDICAL_V2_CONTRACT,
    functionName: "SOURCE_PROVIDER",
  });

  return {
    MAX_RISK_SCORE: maxRiskScore != null ? Number(maxRiskScore) : 100,
    MAX_BP: maxBP != null ? Number(maxBP) : 200,
    MAX_HEART_RATE: maxHeartRate != null ? Number(maxHeartRate) : 200,
    MAX_TEMP_C: maxTempC != null ? Number(maxTempC) : 50,
    MAX_O2_SAT: maxO2Sat != null ? Number(maxO2Sat) : 100,
    MAX_PAIN: maxPain != null ? Number(maxPain) : 10,
    SOURCE_PATIENT: sourcePatient != null ? Number(sourcePatient) : 0,
    SOURCE_PROVIDER: sourceProvider != null ? Number(sourceProvider) : 1,
  };
}
