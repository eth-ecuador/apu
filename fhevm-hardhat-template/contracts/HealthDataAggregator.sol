// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title HealthDataAggregator - Privacy-Preserving Health Data Aggregation
/// @notice Demonstrates the core Apu privacy claim: individual records stay encrypted,
///         only aggregates are ever decryptable.
/// @dev Enhanced with production patterns from Zama mainnet-s3 winners (ghostlend, veilflow)
/// @dev This is a PROOF OF CONCEPT for the August 2026 poster demo.
contract HealthDataAggregator is ZamaEthereumConfig {

    // =============================================================================
    // CONSTANTS (Winner Pattern: Capping to prevent overflow)
    // =============================================================================

    /// @notice Maximum health value to prevent euint32 overflow in aggregations
    /// @dev Pattern from ghostlend: cap all inputs before encrypted operations
    uint32 public constant MAX_HEALTH_VALUE = 100;  // Risk scores capped at 100

    /// @notice Error codes for result flags (ghostlend pattern)
    uint32 internal constant E_OK = 0;
    uint32 internal constant E_CLAMPED = 1;
    uint32 internal constant E_ALREADY_SUBMITTED = 2;

    // =============================================================================
    // STATE VARIABLES
    // =============================================================================

    /// @notice Owner/admin of the contract (can authorize researchers)
    address public owner;

    /// @notice Authorized researcher who can request aggregate decryption
    address public authorizedResearcher;

    /// @notice Running encrypted sum of all submitted health risk scores
    /// @dev This is the ONLY value that will ever be decryptable
    /// @dev Winner Pattern: Always initialized to non-null handle (prevents KMS errors)
    euint32 private encryptedAggregateSum;

    /// @notice Public count of submissions (not encrypted, for calculating average client-side)
    uint256 public submissionCount;

    /// @notice Mapping to track if a patient has already submitted (prevent double-counting)
    mapping(address => bool) public hasSubmitted;

    /// @notice Individual encrypted submissions (stored but NEVER decryptable)
    /// @dev Winner Pattern: Store individual values for potential future analysis
    mapping(address => euint32) private individualSubmissions;

    /// @notice Per-patient encrypted error flags (ghostlend pattern)
    /// @dev Encrypted error codes: 0 = OK, 1 = CLAMPED
    /// @dev Frontend can decrypt to show if submission had issues
    mapping(address => euint32) private lastError;

    /// @notice Submission nonce per patient (for tracking submission updates)
    mapping(address => uint256) public submissionNonce;

    // =============================================================================
    // EVENTS
    // =============================================================================

    event HealthDataSubmitted(address indexed patient, uint256 timestamp);
    event ResearcherAuthorized(address indexed researcher);
    event ResearcherRevoked(address indexed researcher);
    event AggregateDecryptionRequested(uint256 indexed requestId, bytes32 aggregateHandle);

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

    /// @notice Initialize contract with owner and baseline aggregate
    /// @dev Winner Pattern: Initialize aggregate to trivial encryption of 0 (not null handle)
    /// @dev This prevents KMS errors when revealing aggregates from untouched contracts
    constructor() {
        owner = msg.sender;
        submissionCount = 0;

        // Winner Pattern (ghostlend): Baseline aggregate to REAL trivial-encryption-of-0
        // A never-touched aggregate would be bytes32(0), which KMS rejects on makePubliclyDecryptable
        encryptedAggregateSum = FHE.asEuint32(0);
        FHE.allowThis(encryptedAggregateSum);
    }

    // =============================================================================
    // ADMIN FUNCTIONS
    // =============================================================================

    /// @notice Authorize a researcher to request aggregate decryption
    /// @param researcher Address of the researcher
    function authorizeResearcher(address researcher) external onlyOwner {
        require(researcher != address(0), "Invalid researcher address");
        authorizedResearcher = researcher;
        emit ResearcherAuthorized(researcher);
    }

    /// @notice Revoke researcher authorization
    function revokeResearcher() external onlyOwner {
        address previousResearcher = authorizedResearcher;
        authorizedResearcher = address(0);
        emit ResearcherRevoked(previousResearcher);
    }

    // =============================================================================
    // CORE FUNCTIONALITY: SUBMIT ENCRYPTED HEALTH DATA
    // =============================================================================

    /// @notice Submit an encrypted health risk score (0-100)
    /// @param encryptedRiskScore External encrypted risk score
    /// @param inputProof ZK proof for the encrypted input
    /// @dev Enhanced with winner patterns: capping, error flags, no reverts on encrypted conditions
    function submitHealthData(
        externalEuint32 encryptedRiskScore,
        bytes calldata inputProof
    ) external {
        require(!hasSubmitted[msg.sender], "Already submitted");

        // Step 1: Validate and convert external encrypted input
        euint32 riskScore = FHE.fromExternal(encryptedRiskScore, inputProof);

        // Step 2: Winner Pattern - Cap value to prevent overflow
        // Compare with MAX_HEALTH_VALUE and select the minimum
        ebool exceedsMax = FHE.gt(riskScore, MAX_HEALTH_VALUE);
        euint32 cappedScore = FHE.select(
            exceedsMax,
            FHE.asEuint32(MAX_HEALTH_VALUE),  // If exceeds, use max
            riskScore                          // Otherwise, use original
        );

        // Step 3: Winner Pattern - Record encrypted error flag (was value clamped?)
        euint32 errorFlag = FHE.select(
            exceedsMax,
            FHE.asEuint32(E_CLAMPED),
            FHE.asEuint32(E_OK)
        );

        lastError[msg.sender] = errorFlag;
        FHE.allowThis(errorFlag);
        FHE.allow(errorFlag, msg.sender);  // Patient can decrypt their own error

        submissionNonce[msg.sender]++;

        // Step 4: Store individual submission (but set ACL so it's NEVER decryptable by anyone)
        individualSubmissions[msg.sender] = cappedScore;

        // Critical ACL setup: Allow contract to use this value, but DO NOT allow patient or researcher
        // This proves individual records cannot be decrypted
        FHE.allowThis(cappedScore);
        // Intentionally NOT calling FHE.allow(cappedScore, msg.sender) or FHE.allow(cappedScore, researcher)

        // Step 5: Update running aggregate (always initialized, no branch needed)
        encryptedAggregateSum = FHE.add(encryptedAggregateSum, cappedScore);

        // Step 6: Configure ACL for aggregate (contract + researcher can access)
        FHE.allowThis(encryptedAggregateSum);
        if (authorizedResearcher != address(0)) {
            FHE.allow(encryptedAggregateSum, authorizedResearcher);
        }

        // Step 7: Update state
        hasSubmitted[msg.sender] = true;
        submissionCount++;

        emit HealthDataSubmitted(msg.sender, block.timestamp);
    }

    // =============================================================================
    // BATCH OPERATIONS (DripPay Pattern)
    // =============================================================================

    /// @notice Submit health data for multiple patients in a single transaction
    /// @param patients Array of patient addresses
    /// @param encryptedRiskScores Array of encrypted risk scores (must match patients length)
    /// @param proof Shared input proof for all encrypted values
    /// @dev Winner Pattern: Batch operations save gas when multiple submissions occur together
    function submitHealthDataBatch(
        address[] calldata patients,
        externalEuint32[] calldata encryptedRiskScores,
        bytes calldata proof
    ) external onlyOwner {
        require(patients.length == encryptedRiskScores.length, "Length mismatch");
        require(patients.length > 0 && patients.length <= 50, "Batch size 1-50");

        for (uint256 i = 0; i < patients.length; i++) {
            address patient = patients[i];
            require(!hasSubmitted[patient], "Patient already submitted");

            // Convert encrypted input
            euint32 riskScore = FHE.fromExternal(encryptedRiskScores[i], proof);

            // Cap value
            ebool exceedsMax = FHE.gt(riskScore, MAX_HEALTH_VALUE);
            euint32 cappedScore = FHE.select(exceedsMax, FHE.asEuint32(MAX_HEALTH_VALUE), riskScore);

            // Record error flag
            euint32 errorFlag = FHE.select(exceedsMax, FHE.asEuint32(E_CLAMPED), FHE.asEuint32(E_OK));
            lastError[patient] = errorFlag;
            FHE.allowThis(errorFlag);
            FHE.allow(errorFlag, patient);

            // Store individual submission
            individualSubmissions[patient] = cappedScore;
            FHE.allowThis(cappedScore);

            // Update aggregate
            encryptedAggregateSum = FHE.add(encryptedAggregateSum, cappedScore);

            // Update state
            hasSubmitted[patient] = true;
            submissionNonce[patient]++;
            submissionCount++;

            emit HealthDataSubmitted(patient, block.timestamp);
        }

        // Re-grant aggregate permissions after batch
        FHE.allowThis(encryptedAggregateSum);
        if (authorizedResearcher != address(0)) {
            FHE.allow(encryptedAggregateSum, authorizedResearcher);
        }
    }

    // =============================================================================
    // CORE FUNCTIONALITY: REQUEST AGGREGATE DECRYPTION
    // =============================================================================

    /// @notice Next decryption request ID counter
    uint256 private nextRequestId;

    /// @notice Mapping to track fulfilled decryption requests (replay protection)
    mapping(uint256 => bool) private fulfilledRequests;

    /// @notice Request async decryption of the aggregate sum (authorized researchers only)
    /// @return requestId The decryption request ID
    /// @dev This is step 5 of the demo flow: trigger async decryption of ONLY the aggregate
    function requestAggregateDecryption() external onlyAuthorizedResearcher returns (uint256 requestId) {
        require(submissionCount > 0, "No data submitted yet");

        // Mark the aggregate for public decryption (v0.11.1 API)
        FHE.makePubliclyDecryptable(encryptedAggregateSum);

        // Generate request ID and emit event with handle for off-chain relayer
        requestId = nextRequestId++;
        bytes32 aggregateHandle = euint32.unwrap(encryptedAggregateSum);

        emit AggregateDecryptionRequested(requestId, aggregateHandle);

        return requestId;
    }

    /// @notice Permissionless callback for aggregate decryption fulfillment
    /// @param requestId The decryption request ID
    /// @param cleartexts ABI-encoded decrypted values from KMS
    /// @param decryptionProof KMS signature proof
    /// @dev This is called by anyone (typically the relayer) after KMS decrypts the value
    function fulfillAggregateDecryption(
        uint256 requestId,
        bytes calldata cleartexts,
        bytes calldata decryptionProof
    ) external {
        // Replay protection (v0.11.1: checkSignatures has no replay guard)
        require(!fulfilledRequests[requestId], "Request already fulfilled");

        // Rebuild handle list from STORAGE (not calldata) for security
        bytes32[] memory handles = new bytes32[](1);
        handles[0] = euint32.unwrap(encryptedAggregateSum);

        // CRITICAL: Verify KMS signatures to ensure decryption authenticity
        FHE.checkSignatures(handles, cleartexts, decryptionProof);

        // Decode the decrypted aggregate sum
        uint32 decryptedValue = uint32(abi.decode(cleartexts, (uint256)));

        // Mark request as fulfilled
        fulfilledRequests[requestId] = true;

        // Emit event with decrypted result for frontend
        emit AggregateDecrypted(requestId, decryptedValue, submissionCount);
    }

    /// @notice Event emitted when aggregate decryption completes
    /// @param requestId The decryption request ID
    /// @param aggregateSum The decrypted sum
    /// @param count The number of submissions
    event AggregateDecrypted(uint256 indexed requestId, uint32 aggregateSum, uint256 count);

    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================

    /// @notice Get the public submission count
    /// @return The number of submissions
    function getSubmissionCount() external view returns (uint256) {
        return submissionCount;
    }

    /// @notice Check if a patient has submitted data
    /// @param patient Patient address
    /// @return True if submitted
    function hasPatientSubmitted(address patient) external view returns (bool) {
        return hasSubmitted[patient];
    }

    /// @notice Get the encrypted aggregate sum (for authorized parties only)
    /// @dev This returns the ciphertext handle, not the decrypted value
    /// @return The encrypted aggregate sum
    function getEncryptedAggregate() external view onlyAuthorizedResearcher returns (euint32) {
        require(submissionCount > 0, "No data yet");
        return encryptedAggregateSum;
    }

    /// @notice Calculate average on client-side after decryption
    /// @dev The frontend will decrypt aggregateSum and divide by count client-side
    /// @dev This avoids the complexity of encrypted division (which requires plaintext divisor)
    function getAggregateInfo() external view onlyAuthorizedResearcher returns (
        euint32 encrypted_sum,
        uint256 count
    ) {
        require(submissionCount > 0, "No data yet");
        return (encryptedAggregateSum, submissionCount);
    }

    /// @notice Get patient's encrypted error flag for their last submission
    /// @param patient Patient address
    /// @return The encrypted error code (patient can decrypt)
    function getPatientError(address patient) external view returns (euint32) {
        require(hasSubmitted[patient], "Patient has not submitted");
        return lastError[patient];
    }

    /// @notice Get patient's submission nonce
    /// @param patient Patient address
    /// @return The submission count for this patient
    function getPatientNonce(address patient) external view returns (uint256) {
        return submissionNonce[patient];
    }

    // =============================================================================
    // PUBLIC STATISTICS EPOCH (ghostlend Pattern - For Poster Display)
    // =============================================================================

    /// @notice Status of public statistics epoch
    enum EpochStatus {
        None,       // No epoch created yet
        Pending,    // Epoch closed, awaiting KMS decryption
        Finalized   // Epoch finalized with verified statistics
    }

    /// @notice Public statistics epoch (for poster presentation)
    struct PublicStatsEpoch {
        euint32 aggregateSnapshot;  // Frozen aggregate sum (made publicly decryptable)
        uint256 countSnapshot;      // Frozen count
        uint32 decryptedSum;        // Decrypted aggregate (after finalization)
        uint32 decryptedAverage;    // Calculated average (after finalization)
        uint40 closedAt;            // Timestamp of epoch close
        EpochStatus status;         // Current status
    }

    /// @notice Current public statistics epoch
    uint256 public currentEpochId;

    /// @notice Mapping of epoch ID to public statistics
    mapping(uint256 => PublicStatsEpoch) public publicEpochs;

    /// @notice Event emitted when public statistics epoch is closed
    event PublicStatsEpochClosed(uint256 indexed epochId, bytes32 aggregateHandle, uint256 count);

    /// @notice Event emitted when public statistics are finalized
    event PublicStatsEpochFinalized(uint256 indexed epochId, uint32 sum, uint32 average, uint256 count);

    /// @notice Close current epoch and expose aggregate for public decryption (anyone can call)
    /// @dev Winner Pattern: Two-phase reveal (close → finalize) like ghostlend epochs
    /// @dev This is for POSTER DISPLAY - creates publicly verifiable statistics
    /// @return epochId The epoch ID that was closed
    function closePublicStatsEpoch() external returns (uint256 epochId) {
        require(submissionCount > 0, "No data to close");
        epochId = currentEpochId;
        require(publicEpochs[epochId].status == EpochStatus.None, "Epoch already closed");

        // Freeze current aggregate and count
        PublicStatsEpoch storage epoch = publicEpochs[epochId];
        epoch.aggregateSnapshot = encryptedAggregateSum;
        epoch.countSnapshot = submissionCount;
        epoch.closedAt = uint40(block.timestamp);
        epoch.status = EpochStatus.Pending;

        // Winner Pattern: makePubliclyDecryptable is PERMANENT and IRREVOCABLE
        // Only use for aggregates that should be public
        FHE.allowThis(epoch.aggregateSnapshot);
        FHE.makePubliclyDecryptable(epoch.aggregateSnapshot);

        emit PublicStatsEpochClosed(epochId, euint32.unwrap(epoch.aggregateSnapshot), epoch.countSnapshot);
        return epochId;
    }

    /// @notice Finalize public statistics epoch with KMS-verified decryption
    /// @param epochId The epoch ID to finalize
    /// @param cleartexts ABI-encoded decrypted values from KMS
    /// @param decryptionProof KMS signature proof
    /// @dev Winner Pattern: Permissionless finalization with on-chain KMS verification
    /// @dev Anyone can call this after KMS decrypts the aggregate
    function finalizePublicStatsEpoch(
        uint256 epochId,
        bytes calldata cleartexts,
        bytes calldata decryptionProof
    ) external {
        PublicStatsEpoch storage epoch = publicEpochs[epochId];
        require(epoch.status == EpochStatus.Pending, "Epoch not pending");

        // Winner Pattern: Rebuild handle list FROM STORAGE (not calldata) for security
        bytes32[] memory handles = new bytes32[](1);
        handles[0] = euint32.unwrap(epoch.aggregateSnapshot);

        // CRITICAL: Verify KMS signatures to ensure decryption authenticity
        FHE.checkSignatures(handles, cleartexts, decryptionProof);

        // Decode the decrypted aggregate sum
        uint32 decryptedSum = uint32(abi.decode(cleartexts, (uint256)));

        // Calculate average (plaintext division, safe now that sum is decrypted)
        uint32 average = epoch.countSnapshot > 0 ? uint32(decryptedSum / epoch.countSnapshot) : 0;

        // Store results
        epoch.decryptedSum = decryptedSum;
        epoch.decryptedAverage = average;
        epoch.status = EpochStatus.Finalized;

        // Advance to next epoch
        currentEpochId++;

        emit PublicStatsEpochFinalized(epochId, decryptedSum, average, epoch.countSnapshot);
    }

    /// @notice Get public statistics for a finalized epoch
    /// @param epochId The epoch ID
    /// @return sum The decrypted aggregate sum
    /// @return average The calculated average
    /// @return count The number of submissions
    /// @return closedAt The timestamp when epoch was closed
    function getPublicStats(uint256 epochId) external view returns (
        uint32 sum,
        uint32 average,
        uint256 count,
        uint40 closedAt
    ) {
        PublicStatsEpoch storage epoch = publicEpochs[epochId];
        require(epoch.status == EpochStatus.Finalized, "Epoch not finalized");
        return (epoch.decryptedSum, epoch.decryptedAverage, epoch.countSnapshot, epoch.closedAt);
    }

    // =============================================================================
    // SECURITY NOTE
    // =============================================================================

    /// @notice INTENTIONAL SECURITY DESIGN:
    /// Individual submissions stored in `individualSubmissions` are encrypted
    /// but have NO ACL permissions granted to anyone (not even the patient).
    /// This proves the core privacy claim: individual records cannot be decrypted.
    ///
    /// Only `encryptedAggregateSum` has ACL permissions for the authorized researcher,
    /// and only this value can be decrypted via requestAggregateDecryption().
    ///
    /// The public statistics epochs use makePubliclyDecryptable() on aggregate snapshots
    /// to create verifiable public statistics for the poster presentation.
    ///
    /// This is the KEY SECURITY PROPERTY for the poster presentation.
}
