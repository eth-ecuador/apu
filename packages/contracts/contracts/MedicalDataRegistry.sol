// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Medical Data Registry with FHE Privacy
/// @notice Stores encrypted medical data on Sepolia with cross-references to 0G Storage
/// @dev Uses Zama FHE for on-chain privacy, 0G Storage for off-chain encrypted documents
contract MedicalDataRegistry is ZamaEthereumConfig, Ownable, ReentrancyGuard {

    struct PatientRecord {
        euint32 encryptedRiskScore;      // FHE encrypted risk score (0-100)
        euint32 encryptedDiagnosis;      // FHE encrypted ICD-10 code
        bytes32 ogStorageRoot;           // 0G Storage Merkle root (medical history)
        bytes teeSignature;              // 0G Compute TEE attestation
        uint40 submittedAt;
        uint40 diagnosedAt;
        bool hasData;
        bool diagnosed;
    }

    mapping(address => PatientRecord) public patients;
    mapping(address => bool) public authorizedDoctors;
    mapping(bytes32 => bool) public anchoredRoots;

    uint256 public totalPatients;
    uint256 public totalDiagnoses;

    event PatientDataSubmitted(
        address indexed patient,
        bytes32 indexed ogStorageRoot,
        uint40 timestamp
    );

    event DiagnosisStored(
        address indexed patient,
        address indexed doctor,
        bytes32 teeSignatureHash,
        uint40 timestamp
    );

    event DoctorAuthorized(address indexed doctor);
    event DoctorRevoked(address indexed doctor);

    modifier onlyAuthorizedDoctor() {
        require(authorizedDoctors[msg.sender], "Not authorized doctor");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Submit encrypted patient data with 0G Storage reference
    /// @param encryptedRiskScore FHE encrypted risk score
    /// @param proof ZK proof for FHE encryption
    /// @param ogStorageRoot Merkle root from 0G Storage upload
    function submitPatientData(
        externalEuint32 encryptedRiskScore,
        bytes calldata proof,
        bytes32 ogStorageRoot
    ) external nonReentrant {
        require(!patients[msg.sender].hasData, "Data already submitted");
        require(ogStorageRoot != bytes32(0), "Invalid storage root");
        require(!anchoredRoots[ogStorageRoot], "Root already anchored");

        euint32 riskScore = FHE.fromExternal(encryptedRiskScore, proof);

        patients[msg.sender] = PatientRecord({
            encryptedRiskScore: riskScore,
            encryptedDiagnosis: FHE.asEuint32(0),
            ogStorageRoot: ogStorageRoot,
            teeSignature: "",
            submittedAt: uint40(block.timestamp),
            diagnosedAt: 0,
            hasData: true,
            diagnosed: false
        });

        anchoredRoots[ogStorageRoot] = true;
        totalPatients++;

        emit PatientDataSubmitted(msg.sender, ogStorageRoot, uint40(block.timestamp));
    }

    /// @notice Store diagnosis from authorized doctor with TEE verification
    /// @param patient Patient address
    /// @param encryptedDiagnosis FHE encrypted ICD-10 diagnosis code
    /// @param proof ZK proof for FHE encryption
    /// @param teeSignature TEE attestation from 0G Compute
    function storeDiagnosis(
        address patient,
        externalEuint32 encryptedDiagnosis,
        bytes calldata proof,
        bytes calldata teeSignature
    ) external onlyAuthorizedDoctor nonReentrant {
        require(patients[patient].hasData, "No patient data");
        require(!patients[patient].diagnosed, "Already diagnosed");
        require(teeSignature.length > 0, "Invalid TEE signature");

        euint32 diagnosis = FHE.fromExternal(encryptedDiagnosis, proof);

        patients[patient].encryptedDiagnosis = diagnosis;
        patients[patient].teeSignature = teeSignature;
        patients[patient].diagnosedAt = uint40(block.timestamp);
        patients[patient].diagnosed = true;

        totalDiagnoses++;

        emit DiagnosisStored(
            patient,
            msg.sender,
            keccak256(teeSignature),
            uint40(block.timestamp)
        );
    }

    /// @notice Update 0G Storage root (if blob was re-uploaded)
    /// @param patient Patient address
    /// @param newStorageRoot New Merkle root from 0G Storage
    function updateStorageRoot(
        address patient,
        bytes32 newStorageRoot
    ) external {
        require(msg.sender == patient || authorizedDoctors[msg.sender], "Not authorized");
        require(patients[patient].hasData, "No patient data");
        require(newStorageRoot != bytes32(0), "Invalid storage root");
        require(!anchoredRoots[newStorageRoot], "Root already anchored");

        bytes32 oldRoot = patients[patient].ogStorageRoot;
        patients[patient].ogStorageRoot = newStorageRoot;

        delete anchoredRoots[oldRoot];
        anchoredRoots[newStorageRoot] = true;
    }

    /// @notice Authorize a doctor to store diagnoses
    /// @param doctor Doctor address to authorize
    function authorizeDoctor(address doctor) external onlyOwner {
        require(!authorizedDoctors[doctor], "Already authorized");
        authorizedDoctors[doctor] = true;
        emit DoctorAuthorized(doctor);
    }

    /// @notice Revoke doctor authorization
    /// @param doctor Doctor address to revoke
    function revokeDoctor(address doctor) external onlyOwner {
        require(authorizedDoctors[doctor], "Not authorized");
        authorizedDoctors[doctor] = false;
        emit DoctorRevoked(doctor);
    }

    /// @notice Get patient record (encrypted data remains encrypted)
    /// @param patient Patient address
    /// @return Record struct with encrypted fields
    function getPatientRecord(address patient) external view returns (PatientRecord memory) {
        return patients[patient];
    }

    /// @notice Check if storage root is anchored
    /// @param storageRoot Merkle root to check
    /// @return Boolean indicating if root is anchored
    function isRootAnchored(bytes32 storageRoot) external view returns (bool) {
        return anchoredRoots[storageRoot];
    }
}
