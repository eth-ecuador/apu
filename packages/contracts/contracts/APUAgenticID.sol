// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./IERC7857.sol";

/// @title APU Agentic ID (Medical AI Agent NFTs)
/// @notice ERC-7857 compliant NFTs for privacy-preserving medical AI agents
/// @dev Integrates with 0G Storage for encrypted metadata and 0G Compute for TEE verification
contract APUAgenticID is ERC721, IERC7857, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    // ============================================
    // State Variables
    // ============================================

    uint256 private _nextTokenId;

    /// @notice Oracle address for TEE/ZKP verification
    address public oracleAddress;

    /// @notice Agent metadata (encrypted, stored on 0G)
    mapping(uint256 => IntelligentData[]) private _intelligentData;

    /// @notice Usage authorizations (tokenId => executor => authorized)
    mapping(uint256 => mapping(address => bool)) private _authorizations;

    /// @notice Prevent replay attacks
    mapping(bytes32 => bool) private _usedProofs;

    /// @notice Track agents by specialty (e.g., "tuberculosis-diagnosis")
    mapping(string => uint256[]) public agentsBySpecialty;

    /// @notice Agent metadata
    struct AgentMetadata {
        string name;              // e.g., "TB Diagnostic Agent v2.1"
        string specialty;         // e.g., "tuberculosis-diagnosis"
        string modelVersion;      // e.g., "qwen2.5-omni-7b"
        uint256 createdAt;
        uint256 totalInferences;
        bool active;
    }

    mapping(uint256 => AgentMetadata) public agentMetadata;

    // ============================================
    // Events (additional to IERC7857)
    // ============================================

    event AgentMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string specialty,
        bytes32 dataHash
    );

    event InferenceExecuted(
        uint256 indexed tokenId,
        address indexed executor,
        bytes32 resultHash
    );

    event OracleUpdated(
        address indexed oldOracle,
        address indexed newOracle
    );

    // ============================================
    // Modifiers
    // ============================================

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _;
    }

    modifier onlyOwnerOrAuthorized(uint256 tokenId) {
        require(
            ownerOf(tokenId) == msg.sender || _authorizations[tokenId][msg.sender],
            "Not authorized"
        );
        _;
    }

    // ============================================
    // Constructor
    // ============================================

    constructor(
        address _oracleAddress
    ) ERC721("APU Medical AI Agent", "APUAI") Ownable(msg.sender) {
        require(_oracleAddress != address(0), "Invalid oracle address");
        oracleAddress = _oracleAddress;
    }

    // ============================================
    // Minting
    // ============================================

    /// @notice Mint a new AI agent NFT
    /// @param to Owner address
    /// @param name Agent name
    /// @param specialty Medical specialty
    /// @param modelVersion AI model version
    /// @param dataHash Hash of encrypted agent data (stored on 0G Storage)
    /// @param storageURI 0G Storage URI for encrypted metadata
    /// @return tokenId New token ID
    function mintAgent(
        address to,
        string calldata name,
        string calldata specialty,
        string calldata modelVersion,
        bytes32 dataHash,
        string calldata storageURI
    ) external onlyOwner returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(dataHash != bytes32(0), "Invalid data hash");
        require(bytes(storageURI).length > 0, "Invalid storage URI");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        // Store metadata
        agentMetadata[tokenId] = AgentMetadata({
            name: name,
            specialty: specialty,
            modelVersion: modelVersion,
            createdAt: block.timestamp,
            totalInferences: 0,
            active: true
        });

        // Store intelligent data
        _intelligentData[tokenId].push(IntelligentData({
            description: string(abi.encodePacked(name, " - ", specialty)),
            dataHash: dataHash,
            storageURI: storageURI
        }));

        // Track by specialty
        agentsBySpecialty[specialty].push(tokenId);

        emit AgentMinted(tokenId, to, specialty, dataHash);

        return tokenId;
    }

    // ============================================
    // ERC-7857 Core Functions
    // ============================================

    /// @inheritdoc IERC7857
    function iTransfer(
        address to,
        uint256 tokenId,
        TransferValidityProof calldata proof
    ) external override nonReentrant onlyTokenOwner(tokenId) {
        require(to != address(0), "Invalid recipient");
        require(_verifyTransferProof(tokenId, proof), "Invalid proof");

        // Update data hash after re-encryption
        IntelligentData[] storage data = _intelligentData[tokenId];
        require(data.length > 0, "No intelligent data");

        data[data.length - 1].dataHash = proof.newDataHash;

        // Transfer ownership
        _transfer(msg.sender, to, tokenId);

        emit Transferred(msg.sender, to, tokenId, proof.newDataHash);
        emit PublishedSealedKey(tokenId, to, proof.sealedKey);
    }

    /// @inheritdoc IERC7857
    function iClone(
        address to,
        uint256 tokenId,
        TransferValidityProof calldata proof
    ) external override nonReentrant onlyTokenOwner(tokenId) returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(_verifyTransferProof(tokenId, proof), "Invalid proof");

        // Mint new token (clone)
        uint256 newTokenId = _nextTokenId++;
        _safeMint(to, newTokenId);

        // Copy metadata
        AgentMetadata storage original = agentMetadata[tokenId];
        agentMetadata[newTokenId] = AgentMetadata({
            name: string(abi.encodePacked(original.name, " (Clone)")),
            specialty: original.specialty,
            modelVersion: original.modelVersion,
            createdAt: block.timestamp,
            totalInferences: 0,
            active: true
        });

        // Copy intelligent data with new hash
        IntelligentData[] storage originalData = _intelligentData[tokenId];
        require(originalData.length > 0, "No intelligent data");

        _intelligentData[newTokenId].push(IntelligentData({
            description: originalData[0].description,
            dataHash: proof.newDataHash,
            storageURI: originalData[0].storageURI
        }));

        agentsBySpecialty[original.specialty].push(newTokenId);

        emit Cloned(tokenId, newTokenId, to);
        emit PublishedSealedKey(newTokenId, to, proof.sealedKey);

        return newTokenId;
    }

    /// @inheritdoc IERC7857
    function authorizeUsage(
        uint256 tokenId,
        address executor
    ) external override onlyTokenOwner(tokenId) {
        require(executor != address(0), "Invalid executor");
        require(!_authorizations[tokenId][executor], "Already authorized");

        _authorizations[tokenId][executor] = true;

        emit Authorization(tokenId, executor, "");
    }

    /// @inheritdoc IERC7857
    function revokeAuthorization(
        uint256 tokenId,
        address executor
    ) external override onlyTokenOwner(tokenId) {
        require(_authorizations[tokenId][executor], "Not authorized");

        _authorizations[tokenId][executor] = false;

        emit AuthorizationRevoked(tokenId, executor);
    }

    /// @inheritdoc IERC7857
    function intelligentDataOf(uint256 tokenId) external view override returns (IntelligentData[] memory) {
        require(_exists(tokenId), "Token does not exist");
        return _intelligentData[tokenId];
    }

    /// @inheritdoc IERC7857
    function isAuthorized(uint256 tokenId, address executor) external view override returns (bool) {
        return ownerOf(tokenId) == executor || _authorizations[tokenId][executor];
    }

    // ============================================
    // Agent Operations
    // ============================================

    /// @notice Record an inference execution (called by 0G Compute)
    /// @param tokenId Agent token ID
    /// @param resultHash Hash of inference result
    function recordInference(
        uint256 tokenId,
        bytes32 resultHash
    ) external onlyOwnerOrAuthorized(tokenId) {
        require(_exists(tokenId), "Token does not exist");
        require(agentMetadata[tokenId].active, "Agent not active");

        agentMetadata[tokenId].totalInferences++;

        emit InferenceExecuted(tokenId, msg.sender, resultHash);
    }

    /// @notice Deactivate an agent
    /// @param tokenId Agent token ID
    function deactivateAgent(uint256 tokenId) external onlyTokenOwner(tokenId) {
        agentMetadata[tokenId].active = false;
    }

    /// @notice Reactivate an agent
    /// @param tokenId Agent token ID
    function reactivateAgent(uint256 tokenId) external onlyTokenOwner(tokenId) {
        agentMetadata[tokenId].active = true;
    }

    // ============================================
    // Admin Functions
    // ============================================

    /// @notice Update oracle address
    /// @param newOracle New oracle address
    function updateOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle address");
        address oldOracle = oracleAddress;
        oracleAddress = newOracle;
        emit OracleUpdated(oldOracle, newOracle);
    }

    // ============================================
    // Internal Functions
    // ============================================

    /// @notice Verify transfer proof using oracle
    /// @param tokenId Token ID being transferred
    /// @param proof Transfer validity proof
    /// @return Boolean indicating if proof is valid
    function _verifyTransferProof(
        uint256 tokenId,
        TransferValidityProof calldata proof
    ) internal returns (bool) {
        // Prevent replay attacks
        bytes32 proofHash = keccak256(abi.encodePacked(
            tokenId,
            proof.oldDataHash,
            proof.newDataHash,
            proof.timestamp
        ));
        require(!_usedProofs[proofHash], "Proof already used");
        _usedProofs[proofHash] = true;

        // Verify timestamp (within 1 hour)
        require(block.timestamp - proof.timestamp < 3600, "Proof expired");

        // Get current data hash
        IntelligentData[] storage data = _intelligentData[tokenId];
        require(data.length > 0, "No intelligent data");
        require(data[data.length - 1].dataHash == proof.oldDataHash, "Data hash mismatch");

        // Verify oracle proof (simplified for MVP)
        // In production, this would call the oracle contract to verify TEE/ZKP proof
        require(proof.oracleAddress == oracleAddress, "Invalid oracle");
        require(proof.oracleProof.length > 0, "Missing oracle proof");

        // For MVP: Basic signature verification
        // Production would verify TEE attestation or ZKP proof
        bytes32 messageHash = keccak256(abi.encodePacked(
            proof.oldDataHash,
            proof.newDataHash,
            proof.sealedKey
        ));
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address signer = ECDSA.recover(ethSignedHash, proof.oracleProof);

        return signer == oracleAddress;
    }

    /// @notice Check if token exists
    /// @param tokenId Token ID to check
    /// @return Boolean indicating if token exists
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // ============================================
    // View Functions
    // ============================================

    /// @notice Get all agents by specialty
    /// @param specialty Medical specialty
    /// @return Array of token IDs
    function getAgentsBySpecialty(string calldata specialty) external view returns (uint256[] memory) {
        return agentsBySpecialty[specialty];
    }

    /// @notice Get total supply
    /// @return Total number of agents minted
    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }
}
