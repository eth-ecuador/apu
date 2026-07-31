/**
 * Contract ABIs
 * Pattern from ghostlend: Separate file for ABIs
 */

export const healthDataAggregatorAbi = [
  // Admin functions
  {
    type: "function",
    name: "authorizeResearcher",
    inputs: [{ name: "researcher", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revokeResearcher",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Core functionality
  {
    type: "function",
    name: "submitHealthData",
    inputs: [
      { name: "encryptedRiskScore", type: "bytes32" },
      { name: "inputProof", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "submitHealthDataBatch",
    inputs: [
      { name: "patients", type: "address[]" },
      { name: "encryptedRiskScores", type: "bytes32[]" },
      { name: "proof", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "requestAggregateDecryption",
    inputs: [],
    outputs: [{ name: "requestId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "fulfillAggregateDecryption",
    inputs: [
      { name: "requestId", type: "uint256" },
      { name: "cleartexts", type: "bytes" },
      { name: "decryptionProof", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Public statistics epoch
  {
    type: "function",
    name: "closePublicStatsEpoch",
    inputs: [],
    outputs: [{ name: "epochId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "finalizePublicStatsEpoch",
    inputs: [
      { name: "epochId", type: "uint256" },
      { name: "cleartexts", type: "bytes" },
      { name: "decryptionProof", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getPublicStats",
    inputs: [{ name: "epochId", type: "uint256" }],
    outputs: [
      { name: "sum", type: "uint32" },
      { name: "average", type: "uint32" },
      { name: "count", type: "uint256" },
      { name: "closedAt", type: "uint40" },
    ],
    stateMutability: "view",
  },
  // View functions
  {
    type: "function",
    name: "getSubmissionCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasPatientSubmitted",
    inputs: [{ name: "patient", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPatientError",
    inputs: [{ name: "patient", type: "address" }],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPatientNonce",
    inputs: [{ name: "patient", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEncryptedAggregate",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "authorizedResearcher",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "submissionCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "currentEpochId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_HEALTH_VALUE",
    inputs: [],
    outputs: [{ name: "", type: "uint32" }],
    stateMutability: "view",
  },
  // Events
  {
    type: "event",
    name: "HealthDataSubmitted",
    inputs: [
      { name: "patient", type: "address", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ResearcherAuthorized",
    inputs: [{ name: "researcher", type: "address", indexed: true }],
  },
  {
    type: "event",
    name: "ResearcherRevoked",
    inputs: [{ name: "researcher", type: "address", indexed: true }],
  },
  {
    type: "event",
    name: "AggregateDecryptionRequested",
    inputs: [
      { name: "requestId", type: "uint256", indexed: true },
      { name: "aggregateHandle", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AggregateDecrypted",
    inputs: [
      { name: "requestId", type: "uint256", indexed: true },
      { name: "aggregateSum", type: "uint32", indexed: false },
      { name: "count", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PublicStatsEpochClosed",
    inputs: [
      { name: "epochId", type: "uint256", indexed: true },
      { name: "aggregateHandle", type: "bytes32", indexed: false },
      { name: "count", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PublicStatsEpochFinalized",
    inputs: [
      { name: "epochId", type: "uint256", indexed: true },
      { name: "sum", type: "uint32", indexed: false },
      { name: "average", type: "uint32", indexed: false },
      { name: "count", type: "uint256", indexed: false },
    ],
  },
] as const;

/**
 * MedicalRecordsV2 ABI - Production-grade medical records with full vital signs
 */
export const medicalRecordsV2Abi = [
  // Admin functions
  {
    type: "function",
    name: "authorizeResearcher",
    inputs: [{ name: "researcher", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revokeResearcher",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Core functionality - Patient self-report
  {
    type: "function",
    name: "submitPatientSelfReport",
    inputs: [
      { name: "encRiskScore", type: "bytes32" },
      { name: "encSymptomsBitmask", type: "bytes32" },
      { name: "encPainLevel", type: "bytes32" },
      { name: "inputProof", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Core functionality - Clinical assessment
  {
    type: "function",
    name: "submitClinicalAssessment",
    inputs: [
      { name: "patient", type: "address" },
      { name: "encRiskScore", type: "bytes32" },
      { name: "encSystolicBP", type: "bytes32" },
      { name: "encDiastolicBP", type: "bytes32" },
      { name: "encHeartRate", type: "bytes32" },
      { name: "encTemperature", type: "bytes32" },
      { name: "encOxygenSat", type: "bytes32" },
      { name: "encPainLevel", type: "bytes32" },
      { name: "encESILevel", type: "bytes32" },
      { name: "inputProof", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Batch submission
  {
    type: "function",
    name: "submitClinicalAssessmentBatch",
    inputs: [
      { name: "patients", type: "address[]" },
      { name: "encRiskScores", type: "bytes32[]" },
      { name: "inputProof", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Public statistics epoch
  {
    type: "function",
    name: "closePublicStatsEpoch",
    inputs: [],
    outputs: [{ name: "epochId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "finalizePublicStatsEpoch",
    inputs: [
      { name: "epochId", type: "uint256" },
      { name: "cleartexts", type: "bytes" },
      { name: "decryptionProof", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // View functions
  {
    type: "function",
    name: "getCurrentCounts",
    inputs: [],
    outputs: [
      { name: "patientCount", type: "uint256" },
      { name: "providerCount", type: "uint256" },
      { name: "totalCount", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasSubmitted",
    inputs: [{ name: "patient", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getDataSource",
    inputs: [{ name: "patient", type: "address" }],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPatientErrorFlag",
    inputs: [{ name: "patient", type: "address" }],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPublicStats",
    inputs: [{ name: "epochId", type: "uint256" }],
    outputs: [
      { name: "patientSum", type: "uint32" },
      { name: "providerSum", type: "uint32" },
      { name: "patientAvg", type: "uint32" },
      { name: "providerAvg", type: "uint32" },
      { name: "patientCount", type: "uint256" },
      { name: "providerCount", type: "uint256" },
      { name: "closedAt", type: "uint40" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "authorizedResearcher",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "currentEpochId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "patientSubmissionCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "providerSubmissionCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  // Constants
  {
    type: "function",
    name: "MAX_RISK_SCORE",
    inputs: [],
    outputs: [{ name: "", type: "uint32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_BP",
    inputs: [],
    outputs: [{ name: "", type: "uint32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_HEART_RATE",
    inputs: [],
    outputs: [{ name: "", type: "uint32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_TEMP_C",
    inputs: [],
    outputs: [{ name: "", type: "uint32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_O2_SAT",
    inputs: [],
    outputs: [{ name: "", type: "uint32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_PAIN",
    inputs: [],
    outputs: [{ name: "", type: "uint32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "SOURCE_PATIENT",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "SOURCE_PROVIDER",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  // Events
  {
    type: "event",
    name: "HealthRecordSubmitted",
    inputs: [
      { name: "patient", type: "address", indexed: true },
      { name: "dataSource", type: "uint8", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "EpochClosed",
    inputs: [
      { name: "epochId", type: "uint256", indexed: true },
      { name: "patientCount", type: "uint256", indexed: false },
      { name: "providerCount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "EpochFinalized",
    inputs: [
      { name: "epochId", type: "uint256", indexed: true },
      { name: "patientSum", type: "uint32", indexed: false },
      { name: "providerSum", type: "uint32", indexed: false },
      { name: "patientAvg", type: "uint32", indexed: false },
      { name: "providerAvg", type: "uint32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ResearcherAuthorized",
    inputs: [{ name: "researcher", type: "address", indexed: true }],
  },
  {
    type: "event",
    name: "ResearcherRevoked",
    inputs: [{ name: "researcher", type: "address", indexed: true }],
  },
  // ACL - Patient-Doctor Authorization
  {
    type: "function",
    name: "authorizeDoctor",
    inputs: [{ name: "doctor", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revokeDoctor",
    inputs: [{ name: "doctor", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isDoctorAuthorized",
    inputs: [
      { name: "patient", type: "address" },
      { name: "doctor", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  // Individual encrypted data getter (with ACL)
  {
    type: "function",
    name: "getPatientRecord",
    inputs: [{ name: "patient", type: "address" }],
    outputs: [
      { name: "riskScore", type: "bytes32" },
      { name: "systolicBP", type: "bytes32" },
      { name: "diastolicBP", type: "bytes32" },
      { name: "heartRate", type: "bytes32" },
      { name: "temperature", type: "bytes32" },
      { name: "oxygenSaturation", type: "bytes32" },
      { name: "painLevel", type: "bytes32" },
      { name: "esiLevel", type: "bytes32" },
      { name: "symptomsBitmask", type: "bytes32" },
    ],
    stateMutability: "view",
  },
  // ACL Events
  {
    type: "event",
    name: "DoctorAuthorized",
    inputs: [
      { name: "patient", type: "address", indexed: true },
      { name: "doctor", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "DoctorRevoked",
    inputs: [
      { name: "patient", type: "address", indexed: true },
      { name: "doctor", type: "address", indexed: true },
    ],
  },
] as const;
