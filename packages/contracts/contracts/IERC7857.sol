// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title IERC7857 - Agentic ID (AI Agent NFT Standard)
/// @notice Interface for tokenizing AI agents with encrypted metadata
/// @dev Based on EIP-7857 specification for 0G Network integration
interface IERC7857 {

    /// @notice Intelligent data associated with an agent
    struct IntelligentData {
        string description;        // Human-readable description (e.g., "Medical AI Model v2.1")
        bytes32 dataHash;         // Hash of encrypted agent metadata
        string storageURI;        // 0G Storage URI for encrypted data
    }

    /// @notice Proof for transfer validity (TEE or ZKP)
    struct TransferValidityProof {
        bytes32 oldDataHash;      // Hash of data encrypted with old key
        bytes32 newDataHash;      // Hash of data encrypted with new key
        bytes sealedKey;          // New encryption key sealed for recipient
        bytes oracleProof;        // TEE signature or ZKP proof
        address oracleAddress;    // Oracle that verified the transfer
        uint256 timestamp;        // When proof was generated
    }

    /// @notice Access proof from recipient
    struct AccessProof {
        address recipient;
        bytes signature;          // Recipient signature confirming data availability
        uint256 nonce;
    }

    // ============================================
    // Events
    // ============================================

    /// @notice Emitted when agent ownership is transferred with re-encryption
    event Transferred(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId,
        bytes32 newDataHash
    );

    /// @notice Emitted when agent is cloned (data duplicated)
    event Cloned(
        uint256 indexed originalTokenId,
        uint256 indexed clonedTokenId,
        address indexed recipient
    );

    /// @notice Emitted when usage rights are granted
    event Authorization(
        uint256 indexed tokenId,
        address indexed executor,
        bytes permissions
    );

    /// @notice Emitted when usage rights are revoked
    event AuthorizationRevoked(
        uint256 indexed tokenId,
        address indexed executor
    );

    /// @notice Emitted when sealed key is published for recipient
    event PublishedSealedKey(
        uint256 indexed tokenId,
        address indexed recipient,
        bytes sealedKey
    );

    /// @notice Emitted when metadata is updated
    event MetadataUpdated(
        uint256 indexed tokenId,
        bytes32 newDataHash
    );

    // ============================================
    // Core Functions
    // ============================================

    /// @notice Transfer agent ownership with metadata re-encryption
    /// @param to Recipient address
    /// @param tokenId Agent token ID
    /// @param proof TEE/ZKP proof of valid re-encryption
    function iTransfer(
        address to,
        uint256 tokenId,
        TransferValidityProof calldata proof
    ) external;

    /// @notice Clone agent (duplicate data with new encryption)
    /// @param to Recipient address
    /// @param tokenId Agent token ID to clone
    /// @param proof TEE/ZKP proof of valid duplication
    /// @return New token ID for the cloned agent
    function iClone(
        address to,
        uint256 tokenId,
        TransferValidityProof calldata proof
    ) external returns (uint256);

    /// @notice Authorize third party to use agent (without ownership transfer)
    /// @param tokenId Agent token ID
    /// @param executor Address authorized to execute agent
    function authorizeUsage(
        uint256 tokenId,
        address executor
    ) external;

    /// @notice Revoke usage authorization
    /// @param tokenId Agent token ID
    /// @param executor Address to revoke
    function revokeAuthorization(
        uint256 tokenId,
        address executor
    ) external;

    /// @notice Get agent's intelligent data
    /// @param tokenId Agent token ID
    /// @return Array of IntelligentData structs
    function intelligentDataOf(uint256 tokenId) external view returns (IntelligentData[] memory);

    /// @notice Check if address is authorized to use agent
    /// @param tokenId Agent token ID
    /// @param executor Address to check
    /// @return Boolean indicating authorization status
    function isAuthorized(uint256 tokenId, address executor) external view returns (bool);
}
