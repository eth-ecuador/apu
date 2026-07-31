/**
 * Modern FHE hooks for MedicalRecordsV2 contract
 * Pattern from ghostlend mainnet-s3 winner
 * Production-grade medical records with full vital signs
 */

"use client";

import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { useEncrypt, useDecryptValues, useGrantPermit, useHasPermit } from "@zama-fhe/react-sdk";
import { useState, useMemo, useCallback } from "react";
import { ADDR, PERMIT_CONTRACTS } from "@/lib/addresses";
import { medicalRecordsV2Abi } from "@/lib/abis";

/**
 * Submit patient self-report (Patient flow)
 * Encrypts: riskScore, symptomsBitmask, painLevel
 */
export function useSubmitPatientSelfReport() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { mutateAsync: encrypt } = useEncrypt();

  const submitSelfReport = useCallback(
    async (riskScore: number, symptomsBitmask: number, painLevel: number) => {
      if (!address) throw new Error("Wallet not connected");
      if (riskScore < 0 || riskScore > 100) {
        throw new Error("Risk score must be between 0 and 100");
      }
      if (painLevel < 0 || painLevel > 10) {
        throw new Error("Pain level must be between 0 and 10");
      }

      try {
        // Step 1: Encrypt all values client-side
        console.log("Encrypting values:", { riskScore, symptomsBitmask, painLevel });
        const result = await encrypt({
          values: [
            { value: BigInt(riskScore), type: "euint32" },
            { value: BigInt(symptomsBitmask), type: "euint32" },
            { value: BigInt(painLevel), type: "euint32" },
          ],
          contractAddress: ADDR.medicalRecordsV2 as `0x${string}`,
          userAddress: address,
        });

        if (!result || !result.encryptedValues) {
          throw new Error("Encryption failed - please try again");
        }

        console.log("Encryption successful, values:", result.encryptedValues);

        const [encRiskScore, encSymptomsBitmask, encPainLevel] = result.encryptedValues;
        const proof = result.inputProof;

        // Step 2: Submit to contract
        console.log("Submitting to contract...");
        const hash = await writeContractAsync({
          address: ADDR.medicalRecordsV2 as `0x${string}`,
          abi: medicalRecordsV2Abi,
          functionName: "submitPatientSelfReport",
          args: [encRiskScore, encSymptomsBitmask, encPainLevel, proof],
        });

        console.log("Submission successful:", hash);
        return hash;
      } catch (error: any) {
        console.error("Error in submitSelfReport:", error);
        throw new Error(error.message || "Failed to submit self-report");
      }
    },
    [address, encrypt, writeContractAsync]
  );

  return { submitSelfReport };
}

/**
 * Submit clinical assessment (Provider flow)
 * Encrypts: riskScore, systolicBP, diastolicBP, heartRate, temperature, oxygenSat, painLevel, esiLevel
 */
export function useSubmitClinicalAssessment() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { mutateAsync: encrypt } = useEncrypt();

  const submitClinicalAssessment = useCallback(
    async (
      patientAddress: `0x${string}`,
      vitalSigns: {
        riskScore: number;
        systolicBP: number;
        diastolicBP: number;
        heartRate: number;
        temperature: number; // Celsius * 10 (e.g., 38.5°C = 385)
        oxygenSat: number;
        painLevel: number;
        esiLevel: number; // 1-5
      }
    ) => {
      if (!address) throw new Error("Wallet not connected");

      // Validation
      if (vitalSigns.riskScore < 0 || vitalSigns.riskScore > 100) {
        throw new Error("Risk score must be between 0 and 100");
      }
      if (vitalSigns.systolicBP < 0 || vitalSigns.systolicBP > 200) {
        throw new Error("Systolic BP must be between 0 and 200");
      }
      if (vitalSigns.diastolicBP < 0 || vitalSigns.diastolicBP > 200) {
        throw new Error("Diastolic BP must be between 0 and 200");
      }
      if (vitalSigns.heartRate < 0 || vitalSigns.heartRate > 200) {
        throw new Error("Heart rate must be between 0 and 200");
      }
      if (vitalSigns.temperature < 0 || vitalSigns.temperature > 500) {
        throw new Error("Temperature must be between 0 and 500 (celsius x 10)");
      }
      if (vitalSigns.oxygenSat < 0 || vitalSigns.oxygenSat > 100) {
        throw new Error("Oxygen saturation must be between 0 and 100");
      }
      if (vitalSigns.painLevel < 0 || vitalSigns.painLevel > 10) {
        throw new Error("Pain level must be between 0 and 10");
      }
      if (vitalSigns.esiLevel < 1 || vitalSigns.esiLevel > 5) {
        throw new Error("ESI level must be between 1 and 5");
      }

      try {
        // Step 1: Encrypt all vital signs client-side
        console.log("Encrypting vital signs:", vitalSigns);
        const result = await encrypt({
          values: [
            { value: BigInt(vitalSigns.riskScore), type: "euint32" },
            { value: BigInt(vitalSigns.systolicBP), type: "euint32" },
            { value: BigInt(vitalSigns.diastolicBP), type: "euint32" },
            { value: BigInt(vitalSigns.heartRate), type: "euint32" },
            { value: BigInt(vitalSigns.temperature), type: "euint32" },
            { value: BigInt(vitalSigns.oxygenSat), type: "euint32" },
            { value: BigInt(vitalSigns.painLevel), type: "euint32" },
            { value: BigInt(vitalSigns.esiLevel), type: "euint8" },
          ],
          contractAddress: ADDR.medicalRecordsV2 as `0x${string}`,
          userAddress: address,
        });

        if (!result || !result.encryptedValues) {
          throw new Error("Encryption failed - please try again");
        }

        console.log("Encryption successful");

        const [
          encRiskScore,
          encSystolicBP,
          encDiastolicBP,
          encHeartRate,
          encTemperature,
          encOxygenSat,
          encPainLevel,
          encESILevel,
        ] = result.encryptedValues;
        const proof = result.inputProof;

        // Step 2: Submit to contract
        console.log("Submitting clinical assessment...");
        const hash = await writeContractAsync({
          address: ADDR.medicalRecordsV2 as `0x${string}`,
          abi: medicalRecordsV2Abi,
          functionName: "submitClinicalAssessment",
          args: [
            patientAddress,
            encRiskScore,
            encSystolicBP,
            encDiastolicBP,
            encHeartRate,
            encTemperature,
            encOxygenSat,
            encPainLevel,
            encESILevel,
            proof,
          ],
        });

        console.log("Clinical assessment submitted:", hash);
        return hash;
      } catch (error: any) {
        console.error("Error in submitClinicalAssessment:", error);
        throw new Error(error.message || "Failed to submit clinical assessment");
      }
    },
    [address, encrypt, writeContractAsync]
  );

  return { submitClinicalAssessment };
}

/**
 * Batch submit clinical assessments (Owner only - for healthcare providers)
 * Simplified batch with risk scores only
 */
export function useSubmitClinicalAssessmentBatch() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { mutateAsync: encrypt } = useEncrypt();

  const submitBatch = useCallback(
    async (patients: `0x${string}`[], riskScores: number[]) => {
      if (!address) throw new Error("Wallet not connected");
      if (patients.length !== riskScores.length) {
        throw new Error("Patients and risk scores arrays must have same length");
      }
      if (patients.length === 0 || patients.length > 50) {
        throw new Error("Batch size must be 1-50");
      }

      try {
        // Batch encrypt all values
        const values = riskScores.map((score) => ({
          value: BigInt(score),
          type: "euint32" as const,
        }));

        console.log(`Encrypting batch of ${patients.length} assessments...`);
        const result = await encrypt({
          values,
          contractAddress: ADDR.medicalRecordsV2 as `0x${string}`,
          userAddress: address,
        });

        if (!result || !result.encryptedValues) {
          throw new Error("Batch encryption failed - please try again");
        }

        console.log("Batch encryption successful");

        const encryptedData = result.encryptedValues;
        const proof = result.inputProof;

        console.log("Submitting batch...");
        const hash = await writeContractAsync({
          address: ADDR.medicalRecordsV2 as `0x${string}`,
          abi: medicalRecordsV2Abi,
          functionName: "submitClinicalAssessmentBatch",
          args: [patients, encryptedData, proof],
        });

        console.log("Batch submitted:", hash);
        return hash;
      } catch (error: any) {
        console.error("Error in submitBatch:", error);
        throw new Error(error.message || "Failed to submit batch");
      }
    },
    [address, encrypt, writeContractAsync]
  );

  return { submitBatch };
}

/**
 * Decrypt patient's error flag
 * Pattern: Grant permit → Enable query → Decrypt
 */
export function useDecryptPatientErrorFlag(errorHandle?: `0x${string}`) {
  const { mutateAsync: grantPermit } = useGrantPermit();
  const { data: hasPermit } = useHasPermit({ contractAddresses: PERMIT_CONTRACTS });
  const [wantDecrypt, setWantDecrypt] = useState(false);

  const inputs = useMemo(
    () =>
      errorHandle && errorHandle !== "0x0000000000000000000000000000000000000000000000000000000000000000"
        ? [{ encryptedValue: errorHandle, contractAddress: ADDR.medicalRecordsV2 as `0x${string}` }]
        : [],
    [errorHandle]
  );

  // Decrypt (enabled only after user initiates)
  const { data, isLoading } = useDecryptValues(inputs, { enabled: wantDecrypt && inputs.length > 0 });

  const decryptError = useCallback(async () => {
    // Grant permit BEFORE enabling decrypt (ghostlend pattern)
    if (!hasPermit) {
      await grantPermit(PERMIT_CONTRACTS);
    }
    setWantDecrypt(true);
  }, [hasPermit, grantPermit]);

  const revealed = wantDecrypt && !!data && errorHandle && errorHandle in data;
  const errorCode = revealed ? Number(data![errorHandle]) : null;

  // Map error codes to labels (same as HealthDataAggregator)
  const errorLabel =
    errorCode === 0 ? "OK" : errorCode === 1 ? "CLAMPED" : errorCode === 2 ? "ALREADY_SUBMITTED" : null;

  return {
    decryptError,
    errorCode,
    errorLabel,
    isDecrypting: wantDecrypt && !revealed,
    isRevealed: revealed,
    isLoading,
  };
}

/**
 * Close public statistics epoch (Anyone can call)
 */
export function useClosePublicStatsEpoch() {
  const { writeContractAsync } = useWriteContract();

  const closeEpoch = useCallback(async () => {
    const hash = await writeContractAsync({
      address: ADDR.medicalRecordsV2 as `0x${string}`,
      abi: medicalRecordsV2Abi,
      functionName: "closePublicStatsEpoch",
    });

    return hash;
  }, [writeContractAsync]);

  return { closeEpoch };
}

/**
 * Decrypt epoch aggregates (Pattern from ghostlend Position.tsx)
 * Call this AFTER closePublicStatsEpoch to get cleartexts + proof for finalization
 */
export function useDecryptEpochAggregates(
  patientHandle?: `0x${string}`,
  providerHandle?: `0x${string}`
) {
  const { mutateAsync: grantPermit } = useGrantPermit();
  const { data: hasPermit } = useHasPermit({
    contractAddresses: [ADDR.medicalRecordsV2 as `0x${string}`],
  });
  const [wantDecrypt, setWantDecrypt] = useState(false);

  const inputs = useMemo(
    () =>
      patientHandle &&
      providerHandle &&
      patientHandle !== "0x0000000000000000000000000000000000000000000000000000000000000000" &&
      providerHandle !== "0x0000000000000000000000000000000000000000000000000000000000000000"
        ? [
            { encryptedValue: patientHandle, contractAddress: ADDR.medicalRecordsV2 as `0x${string}` },
            { encryptedValue: providerHandle, contractAddress: ADDR.medicalRecordsV2 as `0x${string}` },
          ]
        : [],
    [patientHandle, providerHandle]
  );

  // REAL relayer/KMS decrypt (enabled only after user clicks Decrypt)
  const { data, isLoading } = useDecryptValues(inputs, {
    enabled: wantDecrypt && inputs.length > 0,
  });

  const decryptAggregates = useCallback(async () => {
    // Grant permit BEFORE enabling decrypt (ghostlend pattern)
    if (!hasPermit) {
      await grantPermit([ADDR.medicalRecordsV2 as `0x${string}`]);
    }
    setWantDecrypt(true);
  }, [hasPermit, grantPermit]);

  const revealed =
    wantDecrypt &&
    !!data &&
    patientHandle &&
    providerHandle &&
    patientHandle in data &&
    providerHandle in data;

  const patientSum = revealed ? (data[patientHandle] as bigint) : undefined;
  const providerSum = revealed ? (data[providerHandle] as bigint) : undefined;

  return {
    decryptAggregates,
    isDecrypting: isLoading,
    patientSum,
    providerSum,
    revealed,
  };
}

/**
 * Finalize public statistics epoch with KMS proof (Permissionless)
 */
export function useFinalizePublicStatsEpoch() {
  const { writeContractAsync } = useWriteContract();

  const finalizeEpoch = useCallback(
    async (epochId: number, cleartexts: `0x${string}`, proof: `0x${string}`) => {
      const hash = await writeContractAsync({
        address: ADDR.medicalRecordsV2 as `0x${string}`,
        abi: medicalRecordsV2Abi,
        functionName: "finalizePublicStatsEpoch",
        args: [BigInt(epochId), cleartexts, proof],
      });

      return hash;
    },
    [writeContractAsync]
  );

  return { finalizeEpoch };
}

/**
 * Authorize researcher (Owner only)
 */
export function useAuthorizeResearcher() {
  const { writeContractAsync } = useWriteContract();

  const authorizeResearcher = useCallback(
    async (researcherAddress: `0x${string}`) => {
      const hash = await writeContractAsync({
        address: ADDR.medicalRecordsV2 as `0x${string}`,
        abi: medicalRecordsV2Abi,
        functionName: "authorizeResearcher",
        args: [researcherAddress],
      });

      return hash;
    },
    [writeContractAsync]
  );

  return { authorizeResearcher};
}

// =============================================================================
// PATIENT-DOCTOR ACL HOOKS
// =============================================================================

/**
 * Patient authorizes doctor to access their encrypted records
 */
export function useAuthorizeDoctor() {
  const { writeContractAsync } = useWriteContract();

  const authorizeDoctor = useCallback(
    async (doctorAddress: `0x${string}`) => {
      const hash = await writeContractAsync({
        address: ADDR.medicalRecordsV2 as `0x${string}`,
        abi: medicalRecordsV2Abi,
        functionName: "authorizeDoctor",
        args: [doctorAddress],
      });

      return hash;
    },
    [writeContractAsync]
  );

  return { authorizeDoctor };
}

/**
 * Patient revokes doctor's access to their encrypted records
 */
export function useRevokeDoctor() {
  const { writeContractAsync } = useWriteContract();

  const revokeDoctor = useCallback(
    async (doctorAddress: `0x${string}`) => {
      const hash = await writeContractAsync({
        address: ADDR.medicalRecordsV2 as `0x${string}`,
        abi: medicalRecordsV2Abi,
        functionName: "revokeDoctor",
        args: [doctorAddress],
      });

      return hash;
    },
    [writeContractAsync]
  );

  return { revokeDoctor };
}

// =============================================================================
// INDIVIDUAL DECRYPTION HOOKS (Ghostlend Pattern)
// =============================================================================

/**
 * Decrypt patient's own medical records (individual decryption)
 * Pattern from ghostlend Position.tsx - patient sees their OWN encrypted data
 */
export function useDecryptMyRecords(patientAddress?: `0x${string}`) {
  const { mutateAsync: grantPermit } = useGrantPermit();
  const { data: hasPermit } = useHasPermit({
    contractAddresses: [ADDR.medicalRecordsV2 as `0x${string}`],
  });
  const [wantDecrypt, setWantDecrypt] = useState(false);

  // Get encrypted handles from contract
  const { data: recordData } = useReadContract({
    address: ADDR.medicalRecordsV2 as `0x${string}`,
    abi: medicalRecordsV2Abi,
    functionName: "getPatientRecord",
    args: patientAddress ? [patientAddress] : undefined,
    query: { enabled: !!patientAddress },
  });

  const inputs = useMemo(() => {
    if (!recordData || !Array.isArray(recordData)) return [];

    const [
      riskScore,
      systolicBP,
      diastolicBP,
      heartRate,
      temperature,
      oxygenSaturation,
      painLevel,
      esiLevel,
      symptomsBitmask,
    ] = recordData as `0x${string}`[];

    // Build decrypt inputs for all fields
    return [
      { encryptedValue: riskScore, contractAddress: ADDR.medicalRecordsV2 as `0x${string}` },
      { encryptedValue: systolicBP, contractAddress: ADDR.medicalRecordsV2 as `0x${string}` },
      { encryptedValue: diastolicBP, contractAddress: ADDR.medicalRecordsV2 as `0x${string}` },
      { encryptedValue: heartRate, contractAddress: ADDR.medicalRecordsV2 as `0x${string}` },
      { encryptedValue: temperature, contractAddress: ADDR.medicalRecordsV2 as `0x${string}` },
      { encryptedValue: oxygenSaturation, contractAddress: ADDR.medicalRecordsV2 as `0x${string}` },
      { encryptedValue: painLevel, contractAddress: ADDR.medicalRecordsV2 as `0x${string}` },
      { encryptedValue: esiLevel, contractAddress: ADDR.medicalRecordsV2 as `0x${string}` },
      { encryptedValue: symptomsBitmask, contractAddress: ADDR.medicalRecordsV2 as `0x${string}` },
    ];
  }, [recordData]);

  // KMS decrypt (enabled only after user initiates)
  const { data, isLoading } = useDecryptValues(inputs, {
    enabled: wantDecrypt && inputs.length > 0,
  });

  const decryptRecords = useCallback(async () => {
    // Grant permit BEFORE enabling decrypt (ghostlend pattern)
    if (!hasPermit) {
      await grantPermit([ADDR.medicalRecordsV2 as `0x${string}`]);
    }
    setWantDecrypt(true);
  }, [hasPermit, grantPermit]);

  // Extract decrypted values
  const revealed = wantDecrypt && !!data && recordData && inputs.length > 0;

  const decryptedRecords = useMemo(() => {
    if (!revealed || !recordData) return null;

    const [
      riskScoreHandle,
      systolicBPHandle,
      diastolicBPHandle,
      heartRateHandle,
      temperatureHandle,
      oxygenSaturationHandle,
      painLevelHandle,
      esiLevelHandle,
      symptomsBitmaskHandle,
    ] = recordData as `0x${string}`[];

    return {
      riskScore: Number(data![riskScoreHandle]),
      systolicBP: Number(data![systolicBPHandle]),
      diastolicBP: Number(data![diastolicBPHandle]),
      heartRate: Number(data![heartRateHandle]),
      temperature: Number(data![temperatureHandle]) / 10, // Convert back to celsius
      oxygenSaturation: Number(data![oxygenSaturationHandle]),
      painLevel: Number(data![painLevelHandle]),
      esiLevel: Number(data![esiLevelHandle]),
      symptomsBitmask: Number(data![symptomsBitmaskHandle]),
    };
  }, [revealed, data, recordData]);

  return {
    decryptRecords,
    isDecrypting: isLoading,
    decryptedRecords,
    revealed,
    encryptedHandles: recordData as `0x${string}`[] | undefined,
  };
}

/**
 * Decrypt AUTHORIZED patient's records (doctor's view - if authorized)
 * Pattern from ghostlend Position.tsx - doctor sees patient's encrypted data IF authorized
 */
export function useDecryptPatientRecords(
  patientAddress?: `0x${string}`,
  doctorAddress?: `0x${string}`
) {
  const { mutateAsync: grantPermit } = useGrantPermit();
  const { data: hasPermit } = useHasPermit({
    contractAddresses: [ADDR.medicalRecordsV2 as `0x${string}`],
  });
  const [wantDecrypt, setWantDecrypt] = useState(false);

  // Get encrypted handles from contract (as authorized doctor)
  const { data: recordData } = useReadContract({
    address: ADDR.medicalRecordsV2 as `0x${string}`,
    abi: medicalRecordsV2Abi,
    functionName: "getPatientRecord",
    args: patientAddress ? [patientAddress] : undefined,
    query: {
      enabled: !!patientAddress && !!doctorAddress,
    },
  });

  const inputs = useMemo(() => {
    if (!recordData) return [];
    const [
      riskScore,
      systolicBP,
      diastolicBP,
      heartRate,
      temperature,
      oxygenSaturation,
      painLevel,
      esiLevel,
      symptomsBitmask,
    ] = recordData as `0x${string}`[];

    return [
      { encryptedValue: riskScore, contractAddress: ADDR.medicalRecordsV2 },
      { encryptedValue: systolicBP, contractAddress: ADDR.medicalRecordsV2 },
      { encryptedValue: diastolicBP, contractAddress: ADDR.medicalRecordsV2 },
      { encryptedValue: heartRate, contractAddress: ADDR.medicalRecordsV2 },
      { encryptedValue: temperature, contractAddress: ADDR.medicalRecordsV2 },
      { encryptedValue: oxygenSaturation, contractAddress: ADDR.medicalRecordsV2 },
      { encryptedValue: painLevel, contractAddress: ADDR.medicalRecordsV2 },
      { encryptedValue: esiLevel, contractAddress: ADDR.medicalRecordsV2 },
      { encryptedValue: symptomsBitmask, contractAddress: ADDR.medicalRecordsV2 },
    ];
  }, [recordData]);

  const { data, isLoading } = useDecryptValues(inputs, {
    enabled: wantDecrypt && inputs.length > 0,
  });

  const decryptRecords = useCallback(async () => {
    if (!hasPermit) {
      await grantPermit([ADDR.medicalRecordsV2 as `0x${string}`]);
    }
    setWantDecrypt(true);
  }, [hasPermit, grantPermit]);

  const revealed = wantDecrypt && !isLoading && data !== undefined;

  const decryptedRecords = useMemo(() => {
    if (!revealed || !data || !recordData) return null;

    const [
      riskScoreHandle,
      systolicBPHandle,
      diastolicBPHandle,
      heartRateHandle,
      temperatureHandle,
      oxygenSaturationHandle,
      painLevelHandle,
      esiLevelHandle,
      symptomsBitmaskHandle,
    ] = recordData as `0x${string}`[];

    return {
      riskScore: Number(data![riskScoreHandle]),
      systolicBP: Number(data![systolicBPHandle]),
      diastolicBP: Number(data![diastolicBPHandle]),
      heartRate: Number(data![heartRateHandle]),
      temperature: Number(data![temperatureHandle]),
      oxygenSaturation: Number(data![oxygenSaturationHandle]),
      painLevel: Number(data![painLevelHandle]),
      esiLevel: Number(data![esiLevelHandle]),
      symptomsBitmask: Number(data![symptomsBitmaskHandle]),
      _encHandles: {
        riskScore: riskScoreHandle,
        systolicBP: systolicBPHandle,
        diastolicBP: diastolicBPHandle,
        heartRate: heartRateHandle,
        temperature: temperatureHandle,
        oxygenSaturation: oxygenSaturationHandle,
        painLevel: painLevelHandle,
        esiLevel: esiLevelHandle,
        symptomsBitmask: symptomsBitmaskHandle,
      },
    };
  }, [revealed, data, recordData]);

  return {
    decryptRecords,
    isDecrypting: isLoading,
    decryptedRecords,
    revealed,
  };
}

/**
 * Revoke researcher (Owner only)
 */
export function useRevokeResearcher() {
  const { writeContractAsync } = useWriteContract();

  const revokeResearcher = useCallback(async () => {
    const hash = await writeContractAsync({
      address: ADDR.medicalRecordsV2 as `0x${string}`,
      abi: medicalRecordsV2Abi,
      functionName: "revokeResearcher",
    });

    return hash;
  }, [writeContractAsync]);

  return { revokeResearcher };
}
