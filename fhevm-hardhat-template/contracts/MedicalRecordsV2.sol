// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, externalEuint8, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title MedicalRecordsV2 - Production-Grade Privacy-Preserving Health Records
/// @notice Complete medical data structure with encrypted vital signs, symptoms, and clinical data
/// @dev Based on SAMPLE framework + ESI triage + FHIR standards
contract MedicalRecordsV2 is ZamaEthereumConfig {

    // =============================================================================
    // CONSTANTS
    // =============================================================================

    uint32 public constant MAX_RISK_SCORE = 100;
    uint32 public constant MAX_BP = 200;
    uint32 public constant MAX_HEART_RATE = 200;
    uint32 public constant MAX_TEMP_C = 50; // Stored as temp * 10 (e.g., 37.5°C = 375)
    uint32 public constant MAX_O2_SAT = 100;
    uint32 public constant MAX_PAIN = 10;

    // Error codes
    uint32 internal constant E_OK = 0;
    uint32 internal constant E_CLAMPED = 1;
    uint32 internal constant E_ALREADY_SUBMITTED = 2;
    uint32 internal constant E_INVALID_SOURCE = 3;

    // Data source types
    uint8 public constant SOURCE_PATIENT = 0;
    uint8 public constant SOURCE_PROVIDER = 1;

    // =============================================================================
    // STRUCTS
    // =============================================================================

    /// @notice Complete encrypted health record per patient
    /// @dev All sensitive medical data is encrypted with FHE
    struct EncryptedHealthRecord {
        // Core risk assessment
        euint32 riskScore;           // Calculated risk score (0-100)

        // Vital signs (encrypted)
        euint32 systolicBP;          // Systolic blood pressure (mmHg)
        euint32 diastolicBP;         // Diastolic blood pressure (mmHg)
        euint32 heartRate;           // Heart rate (bpm)
        euint32 temperature;         // Temperature in Celsius * 10 (e.g., 375 = 37.5°C)
        euint32 oxygenSaturation;    // O2 saturation percentage
        euint32 painLevel;           // Pain score (0-10)

        // Clinical assessment (encrypted)
        euint8 esiLevel;             // ESI triage level (1-5)
        euint32 symptomsBitmask;     // Encrypted symptoms flags

        // Metadata
        uint8 dataSource;            // 0=patient self-report, 1=clinical assessment
        uint40 submittedAt;          // Timestamp
        bool isSubmitted;            // Has this patient submitted?

        // Error tracking
        euint32 errorFlag;           // Encrypted error code
    }

    // =============================================================================
    // STATE VARIABLES
    // =============================================================================

    address public owner;
    address public authorizedResearcher;

    /// @notice Individual encrypted health records
    mapping(address => EncryptedHealthRecord) private healthRecords;

    /// @notice Patient-Doctor Access Control: patient => doctor => authorized
    /// @dev Patient can grant/revoke access for doctors to decrypt their records
    mapping(address => mapping(address => bool)) private patientAuthorizations;

    /// @notice Separate aggregates for patient self-reports vs clinical assessments
    euint32 private patientAggregateSum;
    euint32 private providerAggregateSum;

    uint256 public patientSubmissionCount;
    uint256 public providerSubmissionCount;

    /// @notice Public statistics epochs
    uint256 public currentEpochId;

    struct PublicStatsEpoch {
        euint32 patientAggregate;
        euint32 providerAggregate;
        uint256 patientCount;
        uint256 providerCount;
        uint40 closedAt;
        bool isFinalized;
        uint32 patientSum;      // Decrypted
        uint32 providerSum;     // Decrypted
        uint32 patientAverage;  // Decrypted
        uint32 providerAverage; // Decrypted
    }

    mapping(uint256 => PublicStatsEpoch) public publicStatsEpochs;

    // =============================================================================
    // EVENTS
    // =============================================================================

    event HealthRecordSubmitted(
        address indexed patient,
        uint8 dataSource,
        uint256 timestamp
    );

    event ResearcherAuthorized(address indexed researcher);
    event ResearcherRevoked(address indexed researcher);
    event DoctorAuthorized(address indexed patient, address indexed doctor);
    event DoctorRevoked(address indexed patient, address indexed doctor);
    event EpochClosed(uint256 indexed epochId, uint256 patientCount, uint256 providerCount);
    event EpochFinalized(
        uint256 indexed epochId,
        uint32 patientSum,
        uint32 providerSum,
        uint32 patientAvg,
        uint32 providerAvg
    );

    // =============================================================================
    // MODIFIERS
    // =============================================================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorizedResearcher() {
        require(msg.sender == authorizedResearcher, "Not authorized researcher");
        _;
    }

    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================

    constructor() {
        owner = msg.sender;

        // Initialize baseline aggregates
        patientAggregateSum = FHE.asEuint32(0);
        providerAggregateSum = FHE.asEuint32(0);
        FHE.allowThis(patientAggregateSum);
        FHE.allowThis(providerAggregateSum);

        patientSubmissionCount = 0;
        providerSubmissionCount = 0;
        currentEpochId = 0;
    }

    // =============================================================================
    // ADMIN FUNCTIONS
    // =============================================================================

    function authorizeResearcher(address researcher) external onlyOwner {
        require(researcher != address(0), "Invalid researcher address");
        authorizedResearcher = researcher;
        emit ResearcherAuthorized(researcher);
    }

    function revokeResearcher() external onlyOwner {
        address previousResearcher = authorizedResearcher;
        authorizedResearcher = address(0);
        emit ResearcherRevoked(previousResearcher);
    }

    // =============================================================================
    // PATIENT-DOCTOR ACCESS CONTROL (ACL)
    // =============================================================================

    /// @notice Patient authorizes a doctor to access their encrypted records
    /// @param doctor The doctor's address to authorize
    function authorizeDoctor(address doctor) external {
        require(doctor != address(0), "Invalid doctor address");
        require(healthRecords[msg.sender].isSubmitted, "No health record to share");
        patientAuthorizations[msg.sender][doctor] = true;
        emit DoctorAuthorized(msg.sender, doctor);
    }

    /// @notice Patient revokes a doctor's access to their encrypted records
    /// @param doctor The doctor's address to revoke
    function revokeDoctor(address doctor) external {
        patientAuthorizations[msg.sender][doctor] = false;
        emit DoctorRevoked(msg.sender, doctor);
    }

    /// @notice Check if a doctor is authorized to access a patient's records
    /// @param patient The patient's address
    /// @param doctor The doctor's address
    function isDoctorAuthorized(address patient, address doctor) external view returns (bool) {
        return patientAuthorizations[patient][doctor];
    }

    // =============================================================================
    // PATIENT SELF-REPORT SUBMISSION
    // =============================================================================

    /// @notice Patient submits self-assessed health data
    /// @param encRiskScore Encrypted risk score (calculated from symptoms/pain/etc)
    /// @param encSymptomsBitmask Encrypted symptoms flags
    /// @param encPainLevel Encrypted pain level (0-10)
    /// @param inputProof ZK proof for encrypted inputs
    function submitPatientSelfReport(
        externalEuint32 encRiskScore,
        externalEuint32 encSymptomsBitmask,
        externalEuint32 encPainLevel,
        bytes calldata inputProof
    ) external {
        require(!healthRecords[msg.sender].isSubmitted, "Already submitted");

        // Validate and import encrypted values
        euint32 riskScore = FHE.fromExternal(encRiskScore, inputProof);
        euint32 symptomsBitmask = FHE.fromExternal(encSymptomsBitmask, inputProof);
        euint32 painLevel = FHE.fromExternal(encPainLevel, inputProof);

        // Cap risk score
        ebool exceedsMax = FHE.gt(riskScore, MAX_RISK_SCORE);
        euint32 cappedRiskScore = FHE.select(exceedsMax, FHE.asEuint32(MAX_RISK_SCORE), riskScore);

        // Cap pain level
        ebool painExceedsMax = FHE.gt(painLevel, MAX_PAIN);
        euint32 cappedPainLevel = FHE.select(painExceedsMax, FHE.asEuint32(MAX_PAIN), painLevel);

        // Set error flag if clamped
        euint32 errorFlag = FHE.select(exceedsMax, FHE.asEuint32(E_CLAMPED), FHE.asEuint32(E_OK));

        // Store encrypted health record
        healthRecords[msg.sender] = EncryptedHealthRecord({
            riskScore: cappedRiskScore,
            systolicBP: FHE.asEuint32(0),      // Not collected for self-report
            diastolicBP: FHE.asEuint32(0),
            heartRate: FHE.asEuint32(0),
            temperature: FHE.asEuint32(0),
            oxygenSaturation: FHE.asEuint32(0),
            painLevel: cappedPainLevel,
            esiLevel: FHE.asEuint8(0),         // Not applicable for self-report
            symptomsBitmask: symptomsBitmask,
            dataSource: SOURCE_PATIENT,
            submittedAt: uint40(block.timestamp),
            isSubmitted: true,
            errorFlag: errorFlag
        });

        // Allow contract to perform operations on stored data
        FHE.allowThis(cappedRiskScore);
        FHE.allowThis(cappedPainLevel);
        FHE.allowThis(symptomsBitmask);
        FHE.allowThis(errorFlag);

        // Allow patient to decrypt their own error flag
        FHE.allow(errorFlag, msg.sender);

        // Add to patient aggregate
        patientAggregateSum = FHE.add(patientAggregateSum, cappedRiskScore);
        FHE.allowThis(patientAggregateSum);

        patientSubmissionCount++;

        emit HealthRecordSubmitted(msg.sender, SOURCE_PATIENT, block.timestamp);
    }

    // =============================================================================
    // CLINICAL PROVIDER SUBMISSION
    // =============================================================================

    /// @notice Healthcare provider submits clinical assessment with full vital signs
    /// @param patient Patient's wallet address
    /// @param encRiskScore Encrypted calculated risk score
    /// @param encSystolicBP Encrypted systolic blood pressure
    /// @param encDiastolicBP Encrypted diastolic blood pressure
    /// @param encHeartRate Encrypted heart rate
    /// @param encTemperature Encrypted temperature (Celsius * 10)
    /// @param encOxygenSat Encrypted oxygen saturation
    /// @param encPainLevel Encrypted pain score
    /// @param encESILevel Encrypted ESI triage level (1-5)
    /// @param inputProof ZK proof for all encrypted inputs
    function submitClinicalAssessment(
        address patient,
        externalEuint32 encRiskScore,
        externalEuint32 encSystolicBP,
        externalEuint32 encDiastolicBP,
        externalEuint32 encHeartRate,
        externalEuint32 encTemperature,
        externalEuint32 encOxygenSat,
        externalEuint32 encPainLevel,
        externalEuint8 encESILevel,
        bytes calldata inputProof
    ) external onlyOwner {
        require(!healthRecords[patient].isSubmitted, "Patient already submitted");

        // Import all encrypted values
        euint32 riskScore = FHE.fromExternal(encRiskScore, inputProof);
        euint32 systolicBP = FHE.fromExternal(encSystolicBP, inputProof);
        euint32 diastolicBP = FHE.fromExternal(encDiastolicBP, inputProof);
        euint32 heartRate = FHE.fromExternal(encHeartRate, inputProof);
        euint32 temperature = FHE.fromExternal(encTemperature, inputProof);
        euint32 oxygenSat = FHE.fromExternal(encOxygenSat, inputProof);
        euint32 painLevel = FHE.fromExternal(encPainLevel, inputProof);
        euint8 esiLevel = FHE.fromExternal(encESILevel, inputProof);

        // Cap all values (no revert on overflow)
        euint32 cappedRiskScore = FHE.select(
            FHE.gt(riskScore, MAX_RISK_SCORE),
            FHE.asEuint32(MAX_RISK_SCORE),
            riskScore
        );

        // Store complete clinical record
        healthRecords[patient] = EncryptedHealthRecord({
            riskScore: cappedRiskScore,
            systolicBP: systolicBP,
            diastolicBP: diastolicBP,
            heartRate: heartRate,
            temperature: temperature,
            oxygenSaturation: oxygenSat,
            painLevel: painLevel,
            esiLevel: esiLevel,
            symptomsBitmask: FHE.asEuint32(0),  // Could be extended
            dataSource: SOURCE_PROVIDER,
            submittedAt: uint40(block.timestamp),
            isSubmitted: true,
            errorFlag: FHE.asEuint32(E_OK)
        });

        // Allow contract operations
        FHE.allowThis(cappedRiskScore);
        FHE.allowThis(systolicBP);
        FHE.allowThis(diastolicBP);
        FHE.allowThis(heartRate);
        FHE.allowThis(temperature);
        FHE.allowThis(oxygenSat);
        FHE.allowThis(painLevel);
        FHE.allowThis(esiLevel);

        // Add to provider aggregate
        providerAggregateSum = FHE.add(providerAggregateSum, cappedRiskScore);
        FHE.allowThis(providerAggregateSum);

        providerSubmissionCount++;

        emit HealthRecordSubmitted(patient, SOURCE_PROVIDER, block.timestamp);
    }

    // =============================================================================
    // BATCH CLINICAL SUBMISSION
    // =============================================================================

    /// @notice Submit multiple clinical assessments in one transaction
    /// @dev Simplified batch version - can be extended for full vital signs array
    function submitClinicalAssessmentBatch(
        address[] calldata patients,
        externalEuint32[] calldata encRiskScores,
        bytes calldata inputProof
    ) external onlyOwner {
        require(patients.length == encRiskScores.length, "Array length mismatch");
        require(patients.length > 0 && patients.length <= 50, "Batch size 1-50");

        for (uint256 i = 0; i < patients.length; i++) {
            address patient = patients[i];

            if (healthRecords[patient].isSubmitted) {
                continue; // Skip already submitted patients
            }

            euint32 riskScore = FHE.fromExternal(encRiskScores[i], inputProof);
            euint32 cappedRiskScore = FHE.select(
                FHE.gt(riskScore, MAX_RISK_SCORE),
                FHE.asEuint32(MAX_RISK_SCORE),
                riskScore
            );

            healthRecords[patient] = EncryptedHealthRecord({
                riskScore: cappedRiskScore,
                systolicBP: FHE.asEuint32(0),
                diastolicBP: FHE.asEuint32(0),
                heartRate: FHE.asEuint32(0),
                temperature: FHE.asEuint32(0),
                oxygenSaturation: FHE.asEuint32(0),
                painLevel: FHE.asEuint32(0),
                esiLevel: FHE.asEuint8(0),
                symptomsBitmask: FHE.asEuint32(0),
                dataSource: SOURCE_PROVIDER,
                submittedAt: uint40(block.timestamp),
                isSubmitted: true,
                errorFlag: FHE.asEuint32(E_OK)
            });

            FHE.allowThis(cappedRiskScore);
            providerAggregateSum = FHE.add(providerAggregateSum, cappedRiskScore);
            providerSubmissionCount++;

            emit HealthRecordSubmitted(patient, SOURCE_PROVIDER, block.timestamp);
        }

        FHE.allowThis(providerAggregateSum);
    }

    // =============================================================================
    // PUBLIC STATISTICS EPOCH SYSTEM
    // =============================================================================

    /// @notice Close current epoch and prepare aggregates for decryption
    function closePublicStatsEpoch() external returns (uint256 epochId) {
        epochId = currentEpochId;

        publicStatsEpochs[epochId] = PublicStatsEpoch({
            patientAggregate: patientAggregateSum,
            providerAggregate: providerAggregateSum,
            patientCount: patientSubmissionCount,
            providerCount: providerSubmissionCount,
            closedAt: uint40(block.timestamp),
            isFinalized: false,
            patientSum: 0,
            providerSum: 0,
            patientAverage: 0,
            providerAverage: 0
        });

        // Make aggregates publicly decryptable (PERMANENT and IRREVOCABLE)
        FHE.allowThis(patientAggregateSum);
        FHE.allowThis(providerAggregateSum);
        FHE.makePubliclyDecryptable(patientAggregateSum);
        FHE.makePubliclyDecryptable(providerAggregateSum);

        // Reset for next epoch
        currentEpochId++;
        patientAggregateSum = FHE.asEuint32(0);
        providerAggregateSum = FHE.asEuint32(0);
        FHE.allowThis(patientAggregateSum);
        FHE.allowThis(providerAggregateSum);

        patientSubmissionCount = 0;
        providerSubmissionCount = 0;

        emit EpochClosed(epochId, publicStatsEpochs[epochId].patientCount, publicStatsEpochs[epochId].providerCount);
    }

    /// @notice Finalize epoch with decrypted aggregates (called after KMS decryption)
    /// @param epochId The epoch ID to finalize
    /// @param cleartexts ABI-encoded decrypted values from KMS (patient sum, provider sum)
    /// @param decryptionProof KMS signature proof
    function finalizePublicStatsEpoch(
        uint256 epochId,
        bytes calldata cleartexts,
        bytes calldata decryptionProof
    ) external {
        PublicStatsEpoch storage epoch = publicStatsEpochs[epochId];
        require(!epoch.isFinalized, "Already finalized");

        // Rebuild handle list FROM STORAGE for security (winner pattern)
        bytes32[] memory handles = new bytes32[](2);
        handles[0] = euint32.unwrap(epoch.patientAggregate);
        handles[1] = euint32.unwrap(epoch.providerAggregate);

        // CRITICAL: Verify KMS signatures to ensure decryption authenticity
        FHE.checkSignatures(handles, cleartexts, decryptionProof);

        // Decode the decrypted aggregates (patient sum, provider sum)
        (uint256 patientSumRaw, uint256 providerSumRaw) = abi.decode(cleartexts, (uint256, uint256));
        uint32 patientSum = uint32(patientSumRaw);
        uint32 providerSum = uint32(providerSumRaw);

        // Calculate averages
        uint32 patientAvg = epoch.patientCount > 0 ? patientSum / uint32(epoch.patientCount) : 0;
        uint32 providerAvg = epoch.providerCount > 0 ? providerSum / uint32(epoch.providerCount) : 0;

        epoch.patientSum = patientSum;
        epoch.providerSum = providerSum;
        epoch.patientAverage = patientAvg;
        epoch.providerAverage = providerAvg;
        epoch.isFinalized = true;

        emit EpochFinalized(epochId, patientSum, providerSum, patientAvg, providerAvg);
    }

    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================

    function hasSubmitted(address patient) external view returns (bool) {
        return healthRecords[patient].isSubmitted;
    }

    function getDataSource(address patient) external view returns (uint8) {
        require(healthRecords[patient].isSubmitted, "No record");
        return healthRecords[patient].dataSource;
    }

    function getPatientErrorFlag(address patient) external view returns (euint32) {
        require(healthRecords[patient].isSubmitted, "No record");
        return healthRecords[patient].errorFlag;
    }

    // =============================================================================
    // INDIVIDUAL ENCRYPTED DATA GETTERS (with ACL)
    // =============================================================================

    /// @notice Get patient's encrypted health record
    /// @dev Only accessible by: (1) patient themselves, or (2) authorized doctors
    /// @param patient The patient's address
    function getPatientRecord(address patient) external view returns (
        euint32 riskScore,
        euint32 systolicBP,
        euint32 diastolicBP,
        euint32 heartRate,
        euint32 temperature,
        euint32 oxygenSaturation,
        euint32 painLevel,
        euint8 esiLevel,
        euint32 symptomsBitmask
    ) {
        require(healthRecords[patient].isSubmitted, "No record");
        require(
            msg.sender == patient || patientAuthorizations[patient][msg.sender],
            "Not authorized"
        );

        EncryptedHealthRecord storage record = healthRecords[patient];
        return (
            record.riskScore,
            record.systolicBP,
            record.diastolicBP,
            record.heartRate,
            record.temperature,
            record.oxygenSaturation,
            record.painLevel,
            record.esiLevel,
            record.symptomsBitmask
        );
    }

    function getPublicStats(uint256 epochId) external view returns (
        uint32 patientSum,
        uint32 providerSum,
        uint32 patientAvg,
        uint32 providerAvg,
        uint256 patientCount,
        uint256 providerCount,
        uint40 closedAt
    ) {
        PublicStatsEpoch storage epoch = publicStatsEpochs[epochId];
        require(epoch.isFinalized, "Epoch not finalized");

        return (
            epoch.patientSum,
            epoch.providerSum,
            epoch.patientAverage,
            epoch.providerAverage,
            epoch.patientCount,
            epoch.providerCount,
            epoch.closedAt
        );
    }

    function getCurrentCounts() external view returns (
        uint256 patientCount,
        uint256 providerCount,
        uint256 totalCount
    ) {
        return (
            patientSubmissionCount,
            providerSubmissionCount,
            patientSubmissionCount + providerSubmissionCount
        );
    }
}
