/**
 * Modern FHE hooks for health data submission
 * Pattern from ghostlend mainnet-s3 winner
 * Uses @zama-fhe/react-sdk instead of fhevmjs
 */

"use client";

import { useAccount, useWriteContract } from "wagmi";
import { useEncrypt, useDecryptValues, useGrantPermit, useHasPermit } from "@zama-fhe/react-sdk";
import { useState, useMemo, useCallback } from "react";
import { ADDR, PERMIT_CONTRACTS } from "@/lib/addresses";
import { healthDataAggregatorAbi } from "@/lib/abis";

/**
 * Submit encrypted health data (Patient flow)
 */
export function useSubmitHealthData() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { mutateAsync: encrypt } = useEncrypt();

  const submitHealthData = useCallback(
    async (riskScore: number) => {
      if (!address) throw new Error("Wallet not connected");
      if (riskScore < 0 || riskScore > 100) {
        throw new Error("Risk score must be between 0 and 100");
      }

      // Step 1: Encrypt the risk score client-side
      const result = await encrypt({
        values: [{ value: BigInt(riskScore), type: "euint32" }],
        contractAddress: ADDR.healthDataAggregator as `0x${string}`,
        userAddress: address,
      });

      const encryptedValue = result.encryptedValues[0];
      const proof = result.inputProof;

      // Step 2: Submit to contract
      const hash = await writeContractAsync({
        address: ADDR.healthDataAggregator as `0x${string}`,
        abi: healthDataAggregatorAbi,
        functionName: "submitHealthData",
        args: [encryptedValue, proof],
      });

      return hash;
    },
    [address, encrypt, writeContractAsync]
  );

  return { submitHealthData };
}

/**
 * Decrypt patient's error flag
 * Pattern: Grant permit → Enable query → Decrypt
 */
export function useDecryptPatientError(errorHandle?: `0x${string}`) {
  const { mutateAsync: grantPermit } = useGrantPermit();
  const { data: hasPermit } = useHasPermit({ contractAddresses: PERMIT_CONTRACTS });
  const [wantDecrypt, setWantDecrypt] = useState(false);

  const inputs = useMemo(
    () =>
      errorHandle && errorHandle !== "0x0000000000000000000000000000000000000000000000000000000000000000"
        ? [{ encryptedValue: errorHandle, contractAddress: ADDR.healthDataAggregator as `0x${string}` }]
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

  // Map error codes to labels
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
 * Request aggregate decryption (Researcher flow)
 */
export function useRequestAggregateDecryption() {
  const { writeContractAsync } = useWriteContract();

  const requestDecryption = useCallback(async () => {
    const hash = await writeContractAsync({
      address: ADDR.healthDataAggregator as `0x${string}`,
      abi: healthDataAggregatorAbi,
      functionName: "requestAggregateDecryption",
    });

    return hash;
  }, [writeContractAsync]);

  return { requestDecryption };
}

/**
 * Close public statistics epoch (Anyone can call)
 */
export function useClosePublicStatsEpoch() {
  const { writeContractAsync } = useWriteContract();

  const closeEpoch = useCallback(async () => {
    const hash = await writeContractAsync({
      address: ADDR.healthDataAggregator as `0x${string}`,
      abi: healthDataAggregatorAbi,
      functionName: "closePublicStatsEpoch",
    });

    return hash;
  }, [writeContractAsync]);

  return { closeEpoch };
}

/**
 * Finalize public statistics epoch with KMS proof (Permissionless)
 */
export function useFinalizePublicStatsEpoch() {
  const { writeContractAsync } = useWriteContract();

  const finalizeEpoch = useCallback(
    async (epochId: number, cleartexts: `0x${string}`, proof: `0x${string}`) => {
      const hash = await writeContractAsync({
        address: ADDR.healthDataAggregator as `0x${string}`,
        abi: healthDataAggregatorAbi,
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
        address: ADDR.healthDataAggregator as `0x${string}`,
        abi: healthDataAggregatorAbi,
        functionName: "authorizeResearcher",
        args: [researcherAddress],
      });

      return hash;
    },
    [writeContractAsync]
  );

  return { authorizeResearcher };
}

/**
 * Batch submit health data (Owner only - for healthcare providers)
 */
export function useSubmitHealthDataBatch() {
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

      // Batch encrypt all values (modern SDK supports batching)
      const values = riskScores.map((score) => ({
        value: BigInt(score),
        type: "euint32" as const,
      }));

      const result = await encrypt({
        values,
        contractAddress: ADDR.healthDataAggregator as `0x${string}`,
        userAddress: address,
      });

      const encryptedData = result.encryptedValues;
      const proof = result.inputProof;

      const hash = await writeContractAsync({
        address: ADDR.healthDataAggregator as `0x${string}`,
        abi: healthDataAggregatorAbi,
        functionName: "submitHealthDataBatch",
        args: [patients, encryptedData, proof],
      });

      return hash;
    },
    [address, encrypt, writeContractAsync]
  );

  return { submitBatch };
}
