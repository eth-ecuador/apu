# Zama fhEVM Technical Deep Dive & Best Practices Guide

**Status:** Production-Ready Reference Guide
**Date:** 2026-07-30
**Based on:** APU Health Data Platform + Analysis of Zama Winners (ghostlend, DripPay)
**Purpose:** Comprehensive technical reference for future Zama fhEVM projects

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Complete SDK Version Matrix](#complete-sdk-version-matrix)
3. [Dependency Analysis](#dependency-analysis)
4. [Smart Contract Patterns](#smart-contract-patterns)
5. [Encryption/Decryption Implementations](#encryptiondecryption-implementations)
6. [Frontend Integration Patterns](#frontend-integration-patterns)
7. [Winner Pattern Comparison](#winner-pattern-comparison)
8. [Best Practices & Anti-Patterns](#best-practices--anti-patterns)
9. [Integration Architecture](#integration-architecture)
10. [Gas Optimization Strategies](#gas-optimization-strategies)
11. [Production Deployment Checklist](#production-deployment-checklist)
12. [Appendix: Complete Dependency Lists](#appendix-complete-dependency-lists)

---

## Executive Summary

This guide synthesizes learnings from three production-grade fhEVM implementations:

- **APU Health Data Platform** - Privacy-preserving health data aggregation (Sepolia deployed)
- **ghostlend** - Mainnet-S3 winner, complex DeFi lending protocol with encrypted positions
- **DripPay** - Hackathon winner, encrypted payroll system with batch operations

**Key Insight:** All three projects demonstrate convergence on core patterns despite different use cases, validating a set of "battle-tested" practices for fhEVM development.

---

## Complete SDK Version Matrix

### Exact Installed Versions (npm list)

This section shows EXACT versions actually installed in each project (not semver ranges from package.json).

#### Core Zama FHE Libraries - EXACT Versions

| Package | APU Backend | APU Frontend | ghostlend Backend | ghostlend Frontend | DripPay Contract | DripPay Frontend |
|---------|-------------|--------------|-------------------|-------------------|------------------|------------------|
| `@fhevm/solidity` | **0.11.1** | - | **0.11.1** | - | **0.11.1** | - |
| `@fhevm/hardhat-plugin` | **0.4.2** | - | **0.4.2** | - | **0.4.1** | - |
| `@fhevm/mock-utils` | **0.4.2** | - | **0.4.2** | - | **0.4.2** | - |
| `@zama-fhe/react-sdk` | - | **3.3.0** | - | **3.2.0** | - | ❌ |
| `@zama-fhe/sdk` | **3.3.0** | **3.3.0** | - | **3.2.0** | - | ❌ |
| `@zama-fhe/relayer-sdk` | **0.4.1** (unused) | - | **0.4.1** | - | - | **0.4.1** |
| `fhevmjs` | **0.6.2** (unused) | - | ❌ | - | ❌ | ❌ |

**Key Observations:**
- ✅ **100% CONVERGENCE** on `@fhevm/solidity@0.11.1` - All three projects use IDENTICAL version
- ✅ **APU MOST MODERN**: `@zama-fhe/react-sdk@3.3.0` (latest)
- ⚠️ **DripPay DEPRECATED**: Uses `@zama-fhe/relayer-sdk@0.4.1` (old SDK)
- ✅ **APU has redundant packages**: `fhevmjs@0.6.2` and `@zama-fhe/relayer-sdk@0.4.1` are installed but unused

#### Hardhat & Ethereum Libraries - EXACT Versions

| Package | APU Backend | ghostlend Backend | DripPay Contract |
|---------|-------------|-------------------|------------------|
| `hardhat` | **2.29.0** | **2.28.6** | **2.22.17** |
| `ethers` | **6.17.0** | **6.16.0** | **6.13.4** |
| `@nomicfoundation/hardhat-ethers` | **3.1.3** | **3.1.3** | **3.0.8** |
| `@nomicfoundation/hardhat-chai-matchers` | **2.1.2** | **2.1.0** | **2.0.8** |
| `@nomicfoundation/hardhat-verify` | **2.1.3** | **2.1.3** | **2.0.12** |
| `@nomicfoundation/hardhat-network-helpers` | **1.1.2** | **1.1.2** | ❌ |

**Key Observations:**
- ✅ **APU NEWEST**: `hardhat@2.29.0`, `ethers@6.17.0` (latest stable)
- ✅ **APU/ghostlend ALIGNED**: Same versions for most nomicfoundation plugins
- ⚠️ **DripPay BEHIND**: Older 2.0.x versions (still compatible)

#### TypeChain - EXACT Versions

| Package | APU Backend | ghostlend Backend | DripPay Contract |
|---------|-------------|-------------------|------------------|
| `typechain` | **8.3.2** | **8.3.2** | **8.3.2** |
| `@typechain/hardhat` | **9.1.0** | **9.1.0** | **9.1.0** |
| `@typechain/ethers-v6` | **0.5.1** | **0.5.1** | **0.5.1** |

**Key Observations:**
- ✅ **100% CONVERGENCE** - All three projects use IDENTICAL TypeChain versions

#### Testing Libraries - EXACT Versions

| Package | APU Backend | ghostlend Backend | DripPay Contract |
|---------|-------------|-------------------|------------------|
| `chai` | **4.5.0** | **4.5.0** | **4.5.0** |
| `chai-as-promised` | **8.0.2** | **8.0.2** | ❌ |
| `mocha` | **11.7.6** | **11.7.5** | ❌ |
| `@types/chai` | **4.3.20** | **4.3.20** | **4.3.20** |
| `@types/mocha` | **10.0.10** | **10.0.10** | **10.0.10** |

**Key Observations:**
- ✅ **100% CONVERGENCE** on `chai@4.5.0` - CRITICAL (v5 incompatible)
- ✅ **APU slightly newer mocha**: 11.7.6 vs 11.7.5

#### React & Next.js - EXACT Versions

| Package | APU Frontend | ghostlend Frontend | DripPay Frontend |
|---------|--------------|-------------------|------------------|
| `react` | **19.1.0** | **19.0.0** | **19.2.3** |
| `react-dom` | **19.1.0** | **19.0.0** | **19.2.3** |
| `next` | **15.5.2** | **16.2.10** | **16.1.6** |

**Key Observations:**
- ✅ **All use React 19.x** - Latest major version
- ⚠️ **APU uses Next.js 15.x** vs others using 16.x
- ✅ **DripPay has newest React**: 19.2.3

#### Web3 Wallet Libraries - EXACT Versions

| Package | APU Frontend | ghostlend Frontend | DripPay Frontend |
|---------|--------------|-------------------|------------------|
| `wagmi` | **2.19.5** | **2.14.0** | **2.19.5** |
| `viem` | **2.55.10** | **2.21.0** | **2.46.3** |
| `@rainbow-me/rainbowkit` | **2.2.11** | ❌ | **2.2.10** |
| `@tanstack/react-query` | **5.101.4** | **5.62.0** | **5.90.21** |

**Key Observations:**
- ✅ **APU has NEWEST viem**: 2.55.10 (huge jump from ghostlend's 2.21.0)
- ✅ **APU/DripPay same wagmi**: 2.19.5
- ✅ **APU has NEWEST react-query**: 5.101.4
- ✅ **ghostlend**: No RainbowKit (custom wallet UI)

#### TypeScript - EXACT Versions

| Package | APU Backend | APU Frontend | ghostlend Backend | ghostlend Frontend | DripPay Contract | DripPay Frontend |
|---------|-------------|--------------|-------------------|-------------------|------------------|------------------|
| `typescript` | **5.9.3** | **5.9.2** | **5.9.3** | **5.7.0** | **5.7.2** | **~5** |
| `ts-node` | **10.9.2** | - | **10.9.2** | - | **10.9.2** | - |

**Key Observations:**
- ✅ **APU backend NEWEST**: TypeScript 5.9.3
- ✅ **All compatible**: 5.7.x - 5.9.x range

#### OpenZeppelin - EXACT Versions

| Package | APU | ghostlend Backend | DripPay Contract |
|---------|-----|-------------------|------------------|
| `@openzeppelin/confidential-contracts` | ❌ | **0.5.1** | ❌ |
| `@openzeppelin/contracts` | ❌ | **5.6.1** | **5.6.1** |

**Key Observations:**
- ✅ **ghostlend ONLY** uses confidential contracts (BatcherConfidential)
- ✅ **ghostlend/DripPay ALIGNED**: Same OZ contracts version

### Version Compatibility Summary

| Category | 100% Converged | Mostly Aligned | Diverged |
|----------|----------------|----------------|----------|
| **Core FHE** | ✅ @fhevm/solidity | ✅ @fhevm/hardhat-plugin | Frontend SDK approach |
| **TypeChain** | ✅ All packages | - | - |
| **Testing** | ✅ chai, types | - | mocha (minor) |
| **Hardhat** | - | ✅ Major versions | Patch versions |
| **Ethers** | - | ✅ All v6.x | Patch versions |
| **React** | - | ✅ All v19.x | Patch versions |
| **Web3** | - | ✅ wagmi v2, viem v2 | Patch versions |

### Recommended Stack (Based on Analysis)

**For New Projects Starting in 2026:**

```json
{
  "backend": {
    "@fhevm/solidity": "^0.11.1",
    "@fhevm/hardhat-plugin": "^0.4.2",
    "@fhevm/mock-utils": "^0.4.2",
    "hardhat": "^2.29.0",
    "ethers": "^6.17.0",
    "chai": "^4.5.0",
    "typescript": "^5.9.3"
  },
  "frontend": {
    "@zama-fhe/react-sdk": "^3.3.0",
    "@zama-fhe/sdk": "^3.3.0",
    "wagmi": "^2.19.5",
    "viem": "^2.55.10",
    "@rainbow-me/rainbowkit": "^2.2.11",
    "@tanstack/react-query": "^5.101.4",
    "next": "15.5.2",
    "react": "19.1.0"
  }
}
```

**Rationale:**
- Uses **APU's versions** (most current, production-tested on Sepolia)
- Uses **modern SDK** (@zama-fhe/react-sdk, NOT deprecated relayer-sdk)
- **100% compatible** with ghostlend's mainnet-proven stack
- **Latest stable** versions validated across 3 projects

---

## Dependency Analysis

### Backend Dependencies (Hardhat/Solidity)

#### Core fhEVM Libraries

| Package | APU Version | ghostlend | DripPay | Notes |
|---------|-------------|-----------|---------|-------|
| `@fhevm/solidity` | `^0.11.1` | `^0.11.1` | `^0.11.1` | **REQUIRED** - Core FHE operations |
| `@fhevm/hardhat-plugin` | `^0.4.2` | `^0.4.2` | `^0.4.1` | **REQUIRED** - Must be FIRST import |
| `@fhevm/mock-utils` | `^0.4.2` | `^0.4.2` | `^0.4.1` | **REQUIRED** - For testing |
| `@zama-fhe/oracle-solidity` | `^0.1.0` | ❌ | ❌ | Optional - Oracle integration |
| `@zama-fhe/sdk` | `^3.3.0` | ❌ | ❌ | Backend SDK (alternative to relayer) |

**Version Alignment:** All winners use `@fhevm/solidity: ^0.11.1` exactly. This is the current stable version.

#### OpenZeppelin Confidential Contracts

| Package | APU | ghostlend | DripPay |
|---------|-----|-----------|---------|
| `@openzeppelin/confidential-contracts` | ❌ | `^0.5.1` | ❌ |

**ghostlend pattern:** Uses `BatcherConfidential` for async operations. **APU pattern:** Custom implementation without OpenZeppelin (simpler use case).

#### Development Tools

| Package | APU Version | ghostlend | DripPay | Purpose |
|---------|-------------|-----------|---------|---------|
| `hardhat` | `^2.26.0` | `^2.28.6` | `^2.22.17` | Smart contract framework |
| `ethers` | `^6.15.0` | `^6.16.0` | `^6.13.4` | Ethereum library (v6 required) |
| `typescript` | `^5.8.3` | Latest | Latest | Type safety |
| `hardhat-deploy` | `^0.11.45` | ✅ | `^0.14.0` | Deployment scripts |
| `hardhat-gas-reporter` | `^2.3.0` | ✅ | ✅ | Gas analysis |
| `@typechain/hardhat` | `^9.1.0` | ✅ | ✅ | TypeScript contract types |
| `chai` | `^4.5.0` | `^4.3.0` | ✅ | Testing (v4, NOT v5) |

**CRITICAL:** `chai` must be v4.x, not v5. The hardhat chai matchers are incompatible with chai v5.

#### Deprecated Packages (DO NOT USE)

| Package | Status | Replacement |
|---------|--------|-------------|
| `fhevmjs` | ⚠️ Deprecated | `@zama-fhe/sdk` or `@zama-fhe/react-sdk` |
| `@zama-fhe/relayer-sdk` (old) | ⚠️ Deprecated | `@zama-fhe/sdk@^3.x` or `@zama-fhe/react-sdk@^3.x` |

**APU has both:** `fhevmjs: ^0.6.2` (legacy hook, unused) + `@zama-fhe/sdk: ^3.3.0` (modern, active)

### Frontend Dependencies (Next.js/React)

#### Core Zama FHE SDK

| Package | APU Version | ghostlend | DripPay | Notes |
|---------|-------------|-----------|---------|-------|
| `@zama-fhe/react-sdk` | `^3.3.0` | ❌ | ❌ | **MODERN** - React hooks for FHE |
| `@zama-fhe/sdk` | `^3.2.0` | ❌ | ❌ | **MODERN** - Core SDK (viem-based) |
| `@zama-fhe/relayer-sdk` | ❌ | ❌ | `^0.4.1` | **DEPRECATED** (DripPay uses old version) |

**APU is MOST CURRENT:** Uses modern `@zama-fhe/react-sdk@^3.3.0` with React hooks (`useEncrypt`, `useDecrypt`, `useGrantPermit`).

**DripPay uses old pattern:** Manual `createEncryptedInput` + `fhevmjs` instance (pre-SDK hooks era).

#### Wallet Integration

| Package | APU Version | ghostlend | DripPay | Purpose |
|---------|-------------|-----------|---------|---------|
| `wagmi` | `^2.14.0` | Latest | `^2.19.5` | Wallet hooks (v2) |
| `viem` | `^2.21.0` | Latest | `^2.46.3` | Ethereum library |
| `@rainbow-me/rainbowkit` | `^2.2.11` | ❌ | `^2.2.10` | Wallet UI |
| `@tanstack/react-query` | `^5.101.4` | ✅ | `^5.90.21` | Data fetching |
| `ethers` | `^6.15.0` | `^6.16.0` | `^6.16.0` | Legacy support (APU hybrid) |

**Provider Order (CRITICAL):**
```tsx
WagmiProvider → QueryClientProvider → RainbowKitProvider → ZamaProvider
```

**Why:** Zama SDK hooks depend on TanStack Query, so `QueryClientProvider` MUST wrap `ZamaProvider`.

#### Next.js & React

| Package | APU Version | ghostlend | DripPay |
|---------|-------------|-----------|---------|
| `next` | `15.5.2` | Latest | `16.1.6` |
| `react` | `19.1.0` | Latest | `19.2.3` |
| `react-dom` | `19.1.0` | Latest | `19.2.3` |

**WASM Configuration Required:**
```ts
// next.config.ts
webpack: (config) => {
  config.experiments = {
    ...config.experiments,
    asyncWebAssembly: true,  // REQUIRED for @zama-fhe WASM
    layers: true,
  };
  return config;
}
```

---

## Smart Contract Patterns

### 1. Hardhat Configuration (Production-Ready)

**File:** `hardhat.config.ts`

```typescript
import "@fhevm/hardhat-plugin"; // MUST BE FIRST IMPORT
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";
import "solidity-coverage";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY: string = process.env.PRIVATE_KEY || vars.get("PRIVATE_KEY", "");
const INFURA_API_KEY: string = vars.get("INFURA_API_KEY", "");

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: vars.get("ETHERSCAN_API_KEY", ""),
  },
  sourcify: {
    enabled: false,
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : { mnemonic: MNEMONIC },
      chainId: 11155111,
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
    },
    zamaDevnet: {
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : { mnemonic: MNEMONIC },
      chainId: 10901,
      url: "https://rpc.testnet.zama.org",
    },
  },
  solidity: {
    version: "0.8.24", // or 0.8.27 (latest)
    settings: {
      metadata: {
        bytecodeHash: "none", // Deterministic builds
      },
      optimizer: {
        enabled: true,
        runs: 800, // Balance deployment cost vs runtime
      },
      viaIR: true, // CRITICAL for complex FHE contracts (stack depth)
      evmVersion: "cancun", // Latest EVM version
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};

export default config;
```

**Key Settings Explained:**

- **`viaIR: true`** - REQUIRED for contracts with many FHE operations. Without this, you'll get "stack too deep" errors. ghostlend uses this; DripPay doesn't need it (simpler contracts).
- **`evmVersion: "cancun"`** - Use latest EVM features
- **`runs: 800`** - Sweet spot for deployment cost vs runtime gas
- **`bytecodeHash: "none"`** - Enables deterministic builds (same bytecode every time)

### 2. Contract Initialization Pattern (Baseline Aggregate)

**Pattern from ghostlend (H-1 fix):**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract HealthDataAggregator is ZamaEthereumConfig {
    euint32 private encryptedAggregateSum;

    constructor() {
        // CRITICAL: Initialize to REAL trivial-encryption-of-0, NOT null
        // Null handle (bytes32(0)) causes KMS to reject makePubliclyDecryptable()
        encryptedAggregateSum = FHE.asEuint32(0);
        FHE.allowThis(encryptedAggregateSum);
    }
}
```

**Why this matters:**
- A never-touched aggregate would be `bytes32(0)` (null handle)
- KMS rejects `makePubliclyDecryptable()` on null handles
- `FHE.asEuint32(0)` creates a REAL encrypted zero (valid handle)

### 3. Error Handling Pattern (Encrypted Error Flags)

**Pattern from ghostlend (mainnet production):**

```solidity
// Error codes (plaintext constants)
uint32 internal constant E_OK = 0;
uint32 internal constant E_CLAMPED = 1;
uint32 internal constant E_ALREADY_SUBMITTED = 2;

// Encrypted error storage (per user)
mapping(address => euint32) private lastError;

function submitHealthData(
    externalEuint32 encryptedRiskScore,
    bytes calldata inputProof
) external {
    // NO REVERT on encrypted conditions - use select instead
    require(!hasSubmitted[msg.sender], "Already submitted"); // OK: plaintext check

    euint32 riskScore = FHE.fromExternal(encryptedRiskScore, inputProof);

    // Value capping (encrypted comparison)
    ebool exceedsMax = FHE.gt(riskScore, MAX_HEALTH_VALUE);
    euint32 cappedScore = FHE.select(
        exceedsMax,
        FHE.asEuint32(MAX_HEALTH_VALUE), // If exceeds, use max
        riskScore                          // Otherwise, use original
    );

    // Error flag (encrypted)
    euint32 errorFlag = FHE.select(
        exceedsMax,
        FHE.asEuint32(E_CLAMPED),
        FHE.asEuint32(E_OK)
    );

    // Store encrypted error
    lastError[msg.sender] = errorFlag;
    FHE.allowThis(errorFlag);
    FHE.allow(errorFlag, msg.sender); // Patient can decrypt their own error

    // ... continue with capped value
}

// View function to get encrypted error
function getPatientError(address patient) external view returns (euint32) {
    require(hasSubmitted[patient], "Patient has not submitted");
    return lastError[patient];
}
```

**DripPay alternative (simpler use case):**

```solidity
// Traditional revert pattern (no encrypted error flags needed)
error AlreadyEmployee();
error ZeroAmount();

function addEmployee(...) external {
    if (isEmployee[emp]) revert AlreadyEmployee();
    if (amount == 0) revert ZeroAmount();
    // ...
}
```

**When to use each:**
- **Encrypted error flags:** When operations should never revert on encrypted conditions (DeFi, privacy-critical)
- **Traditional reverts:** When all error conditions are plaintext-checkable (simpler contracts)

### 4. ACL (Access Control List) Pattern

**Three-tier ACL model:**

```solidity
function submitHealthData(externalEuint32 encryptedRiskScore, bytes calldata inputProof) external {
    euint32 riskScore = FHE.fromExternal(encryptedRiskScore, inputProof);

    // Tier 1: Contract must access (always required)
    FHE.allowThis(riskScore);

    // Tier 2: User can decrypt their own data (optional)
    FHE.allow(riskScore, msg.sender);

    // Tier 3: Authorized third party (e.g., researcher)
    if (authorizedResearcher != address(0)) {
        FHE.allow(riskScore, authorizedResearcher);
    }
}
```

**CRITICAL: Individual privacy pattern (APU/ghostlend):**

```solidity
// Individual submissions - NEVER decryptable by anyone
individualSubmissions[msg.sender] = cappedScore;
FHE.allowThis(cappedScore); // Contract can use it
// Intentionally NOT calling FHE.allow(cappedScore, anyone)

// Aggregate - ONLY this is decryptable
encryptedAggregateSum = FHE.add(encryptedAggregateSum, cappedScore);
FHE.allowThis(encryptedAggregateSum);
FHE.allow(encryptedAggregateSum, authorizedResearcher); // Researcher can decrypt aggregate
```

**ghostlend advanced pattern (allowTransient):**

```solidity
// Temporary access for token transfers
FHE.allowTransient(encryptedAmount, tokenAddress);
```

### 5. Two-Phase Async Decryption (Epoch Pattern)

**Pattern from ghostlend (production-grade):**

```solidity
enum EpochStatus { None, Pending, Finalized }

struct PublicStatsEpoch {
    euint32 aggregateSnapshot;  // Frozen aggregate
    uint256 countSnapshot;      // Frozen count
    uint32 decryptedSum;        // Result after KMS
    uint32 decryptedAverage;    // Calculated result
    uint40 closedAt;            // Timestamp
    EpochStatus status;         // State machine
}

mapping(uint256 => PublicStatsEpoch) public publicEpochs;
uint256 public currentEpochId;

// Phase 1: Close epoch and request KMS decryption (anyone can call)
function closePublicStatsEpoch() external returns (uint256 epochId) {
    require(submissionCount > 0, "No data to close");
    epochId = currentEpochId;
    require(publicEpochs[epochId].status == EpochStatus.None, "Epoch already closed");

    PublicStatsEpoch storage epoch = publicEpochs[epochId];
    epoch.aggregateSnapshot = encryptedAggregateSum;
    epoch.countSnapshot = submissionCount;
    epoch.closedAt = uint40(block.timestamp);
    epoch.status = EpochStatus.Pending;

    // CRITICAL: makePubliclyDecryptable is PERMANENT and IRREVOCABLE
    // Only use for aggregates that should be public
    FHE.allowThis(epoch.aggregateSnapshot);
    FHE.makePubliclyDecryptable(epoch.aggregateSnapshot);

    emit PublicStatsEpochClosed(epochId, euint32.unwrap(epoch.aggregateSnapshot), epoch.countSnapshot);
}

// Phase 2: Finalize with KMS proof (permissionless, anyone can call)
function finalizePublicStatsEpoch(
    uint256 epochId,
    bytes calldata cleartexts,
    bytes calldata decryptionProof
) external {
    PublicStatsEpoch storage epoch = publicEpochs[epochId];
    require(epoch.status == EpochStatus.Pending, "Epoch not pending");

    // CRITICAL: Rebuild handle list FROM STORAGE (not calldata) for security
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

// View finalized results
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
```

**Security properties:**
1. **Immutability:** Once closed, snapshot cannot be changed
2. **Replay protection:** Status check prevents double-finalization
3. **Signature verification:** `FHE.checkSignatures()` ensures KMS authenticity
4. **Storage-based handles:** Prevents handle substitution attacks

### 6. Batch Operations Pattern (DripPay)

**Shared proof pattern (gas optimization):**

```solidity
function submitHealthDataBatch(
    address[] calldata patients,
    externalEuint32[] calldata encryptedRiskScores,
    bytes calldata proof  // SHARED proof for all values
) external onlyOwner {
    require(patients.length == encryptedRiskScores.length, "Length mismatch");
    require(patients.length > 0 && patients.length <= 50, "Batch size 1-50");

    for (uint256 i = 0; i < patients.length; i++) {
        address patient = patients[i];
        require(!hasSubmitted[patient], "Patient already submitted");

        // Use SAME proof for all encrypted inputs
        euint32 riskScore = FHE.fromExternal(encryptedRiskScores[i], proof);

        // ... process each patient
    }

    // Re-grant aggregate permissions after batch
    FHE.allowThis(encryptedAggregateSum);
    if (authorizedResearcher != address(0)) {
        FHE.allow(encryptedAggregateSum, authorizedResearcher);
    }
}
```

**Frontend batch encryption:**

```typescript
const values = riskScores.map(score => ({ value: BigInt(score), type: "euint32" as const }));
const result = await encrypt({
  values,  // Batch encrypt
  contractAddress,
  userAddress: address,
});

const encryptedData = result.encryptedValues; // Array of handles
const proof = result.inputProof; // SINGLE proof for all
```

---

## Encryption/Decryption Implementations

### Backend Encryption (Hardhat Scripts)

**Pattern from APU (production-tested on Sepolia):**

```typescript
// File: scripts/test-submission.ts
import { ethers, fhevm } from "hardhat";

async function main() {
  const contractAddress = "0x780c06f807E5fB8768A0cD6648A28D8A621F0470";
  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("HealthDataAggregator", contractAddress);

  // Step 1: Initialize FHE CLI API (REQUIRED before encryption)
  await fhevm.initializeCLIApi();

  // Step 2: Encrypt data
  const riskScore = 75;
  const encryptedInput = await fhevm
    .createEncryptedInput(contractAddress, signer.address)
    .add32(riskScore)  // euint32 encryption
    .encrypt();

  console.log("Handle:", encryptedInput.handles[0]);
  console.log("Proof length:", encryptedInput.inputProof.length);

  // Step 3: Submit to contract
  const tx = await contract.submitHealthData(
    encryptedInput.handles[0],
    encryptedInput.inputProof
  );

  const receipt = await tx.wait();
  console.log("Gas used:", receipt.gasUsed.toString());
}
```

**Batch encryption (backend):**

```typescript
const encryptedInput = await fhevm
  .createEncryptedInput(contractAddress, signerAddress)
  .add32(riskScore1)
  .add32(riskScore2)
  .add32(riskScore3)
  .encrypt();

// All handles in one array, one proof for all
const handles = encryptedInput.handles; // [handle1, handle2, handle3]
const proof = encryptedInput.inputProof;
```

### Frontend Encryption (Modern SDK)

**APU pattern (React hooks with @zama-fhe/react-sdk@^3.3.0):**

```typescript
// File: app/hooks/useHealthData.ts
import { useAccount, useWriteContract } from "wagmi";
import { useEncrypt, useDecryptValues, useGrantPermit } from "@zama-fhe/react-sdk";

export function useSubmitHealthData() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { mutateAsync: encrypt } = useEncrypt();

  const submitHealthData = useCallback(async (riskScore: number) => {
    if (!address) throw new Error("Wallet not connected");

    // Step 1: Encrypt client-side (WASM worker)
    const result = await encrypt({
      values: [{ value: BigInt(riskScore), type: "euint32" }],
      contractAddress: ADDR.healthDataAggregator as `0x${string}`,
      userAddress: address,
    });

    const encryptedValue = result.encryptedValues[0];
    const proof = result.inputProof;

    // Step 2: Submit transaction
    const hash = await writeContractAsync({
      address: ADDR.healthDataAggregator as `0x${string}`,
      abi: healthDataAggregatorAbi,
      functionName: "submitHealthData",
      args: [encryptedValue, proof],
    });

    return hash;
  }, [address, encrypt, writeContractAsync]);

  return { submitHealthData };
}
```

**Batch encryption (frontend):**

```typescript
export function useSubmitHealthDataBatch() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { mutateAsync: encrypt } = useEncrypt();

  const submitBatch = useCallback(async (
    patients: `0x${string}`[],
    riskScores: number[]
  ) => {
    // Batch encrypt all values
    const values = riskScores.map(score => ({
      value: BigInt(score),
      type: "euint32" as const,
    }));

    const result = await encrypt({
      values,  // Array of values
      contractAddress: ADDR.healthDataAggregator as `0x${string}`,
      userAddress: address,
    });

    const encryptedData = result.encryptedValues; // Array of handles
    const proof = result.inputProof; // SINGLE proof

    const hash = await writeContractAsync({
      address: ADDR.healthDataAggregator as `0x${string}`,
      abi: healthDataAggregatorAbi,
      functionName: "submitHealthDataBatch",
      args: [patients, encryptedData, proof],
    });

    return hash;
  }, [address, encrypt, writeContractAsync]);

  return { submitBatch };
}
```

### Frontend Decryption (Permit + Decrypt)

**Pattern: Grant permit → Enable query → Decrypt**

```typescript
import { useDecryptValues, useGrantPermit, useHasPermit } from "@zama-fhe/react-sdk";

export function useDecryptPatientError(errorHandle?: `0x${string}`) {
  const { mutateAsync: grantPermit } = useGrantPermit();
  const { data: hasPermit } = useHasPermit({ contractAddresses: PERMIT_CONTRACTS });
  const [wantDecrypt, setWantDecrypt] = useState(false);

  // Prepare inputs (only if handle is valid)
  const inputs = useMemo(() =>
    errorHandle && errorHandle !== "0x0000000000000000000000000000000000000000000000000000000000000000"
      ? [{ encryptedValue: errorHandle, contractAddress: ADDR.healthDataAggregator as `0x${string}` }]
      : [],
    [errorHandle]
  );

  // Decrypt (enabled only after user initiates)
  const { data, isLoading } = useDecryptValues(inputs, { enabled: wantDecrypt && inputs.length > 0 });

  const decryptError = useCallback(async () => {
    // Grant permit BEFORE enabling decrypt
    if (!hasPermit) {
      await grantPermit(PERMIT_CONTRACTS);
    }
    setWantDecrypt(true);
  }, [hasPermit, grantPermit]);

  const revealed = wantDecrypt && !!data && errorHandle && errorHandle in data;
  const errorCode = revealed ? Number(data![errorHandle]) : null;

  // Map error codes to labels
  const errorLabel =
    errorCode === 0 ? "OK" :
    errorCode === 1 ? "CLAMPED" :
    errorCode === 2 ? "ALREADY_SUBMITTED" :
    null;

  return {
    decryptError,
    errorCode,
    errorLabel,
    isDecrypting: wantDecrypt && !revealed,
    isRevealed: revealed,
    isLoading,
  };
}
```

**DripPay pattern (manual EIP-712, legacy):**

```typescript
// Legacy pattern (NOT recommended for new projects)
const decryptBalance = useCallback(async (
  handleHex: `0x${string}`,
  contractAddress: `0x${string}`
) => {
  const instance = await getFhevmInstance();
  const { publicKey, privateKey } = instance.generateKeypair();

  // EIP-712 signature for re-encryption authorization
  const now = Math.floor(Date.now() / 1000);
  const eip712 = instance.createEIP712(
    publicKey,
    [contractAddress],
    now,
    1, // 1 day validity
  );

  const signature = await walletClient.signTypedData({
    account: address,
    ...(eip712 as any),
  });

  // Decrypt with user's keypair
  const results = await instance.userDecrypt(
    [{ handle: handleHex, contractAddress }],
    privateKey,
    publicKey,
    signature,
    [contractAddress],
    address,
    now,
    1,
  );

  return results[handleHex];
}, [address, walletClient]);
```

**Recommendation:** Use modern `@zama-fhe/react-sdk` hooks instead of manual EIP-712 flow.

---

## Frontend Integration Patterns

### Provider Hierarchy (CRITICAL ORDER)

**Pattern from APU (ghostlend-derived):**

```typescript
// File: app/providers.tsx
"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { WagmiProvider, usePublicClient, useWalletClient, useAccount } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { ZamaProvider } from "@zama-fhe/react-sdk";
import { createConfig as createZamaConfig } from "@zama-fhe/sdk/viem";
import { sepolia as zamaSepolia } from "@zama-fhe/sdk/chains";
import { web } from "@zama-fhe/sdk/web";
import { createWalletClient, custom, http, type WalletClient } from "viem";
import { sepolia as viemSepolia } from "viem/chains";
import { config as wagmiConfig } from "./wagmi";
import "@rainbow-me/rainbowkit/styles.css";

const RPC = "https://ethereum-sepolia-rpc.publicnode.com";

/**
 * ZamaBridge - Builds the Zama SDK config from wagmi's viem clients
 * Pattern from ghostlend:
 * - Rebuilds when wallet connects
 * - Read-only placeholder walletClient before connect
 * - Connector-derived signing client as fallback
 */
function ZamaBridge({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address, isConnected, connector } = useAccount();

  // Connector-derived signing client (reliable fallback when useWalletClient() lags)
  const [connectorWC, setConnectorWC] = useState<WalletClient | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isConnected || !address || !connector) {
        setConnectorWC(null);
        return;
      }
      try {
        const provider = (await connector.getProvider()) as any;
        if (cancelled || !provider) return;
        setConnectorWC(
          createWalletClient({
            account: address,
            chain: viemSepolia,
            transport: custom(provider),
          })
        );
      } catch (e) {
        console.error("[zama connector walletClient failed]", e);
        if (!cancelled) setConnectorWC(null);
      }
    })();
    return () => { cancelled = true; };
  }, [isConnected, address, connector]);

  const config = useMemo(() => {
    if (!mounted || !publicClient) return null;

    try {
      // Prefer client with account; fallback to connector-derived; finally http reader
      const signer = (walletClient?.account ? walletClient : null) ?? connectorWC;
      const wc = signer ?? createWalletClient({ chain: viemSepolia, transport: http(RPC) });

      return createZamaConfig({
        chains: [zamaSepolia],
        relayers: { [zamaSepolia.id]: web() }, // Web relayer for KMS
        publicClient: publicClient as any,
        walletClient: wc as any,
      });
    } catch (e) {
      console.error("[zama config init failed]", e);
      return null;
    }
  }, [mounted, publicClient, walletClient, connectorWC]);

  // Wait for config to be ready before rendering children
  if (!config) return null;
  return <ZamaProvider config={config}>{children}</ZamaProvider>;
}

/**
 * Providers - Root provider tree
 * CRITICAL ORDER (ghostlend pattern):
 * 1. WagmiProvider (wallet connection)
 * 2. QueryClientProvider (TanStack Query - ABOVE ZamaProvider)
 * 3. RainbowKitProvider (wallet UI)
 * 4. ZamaProvider (FHE SDK)
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null; // Client-only rendering

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ZamaBridge>{children}</ZamaBridge>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

**Why this order matters:**
1. **WagmiProvider first:** Wallet connection state
2. **QueryClientProvider ABOVE ZamaProvider:** Zama hooks use TanStack Query internally
3. **RainbowKitProvider:** Wallet UI (depends on Wagmi)
4. **ZamaProvider last:** FHE operations (depends on all above)

### Next.js Configuration (WASM Support)

**File:** `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // FHE SDK/worker init is not double-invoke friendly in dev
  reactStrictMode: false,

  // Required headers for @zama-fhe WASM to work in the browser
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },

  // Webpack configuration to handle WASM
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true, // REQUIRED
      layers: true,
    };

    // Ignore optional peer dependencies that are React Native specific
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };

    return config;
  },
};

export default nextConfig;
```

**CRITICAL:**
- `reactStrictMode: false` - Zama SDK doesn't handle double-invocation well
- CORS headers - Required for SharedArrayBuffer (WASM dependency)
- `asyncWebAssembly: true` - Required for FHE WASM modules

---

## Winner Pattern Comparison

### Error Handling Philosophy

| Aspect | ghostlend | APU | DripPay |
|--------|-----------|-----|---------|
| **Encrypted error flags** | ✅ Yes (euint64) | ✅ Yes (euint32) | ❌ No |
| **Clamp-to-zero semantics** | ✅ Yes | ✅ Yes (value capping) | ❌ No |
| **Traditional reverts** | ❌ No (encrypted conditions) | ✅ Mixed (plaintext checks only) | ✅ Yes (all errors) |
| **Error code decryption** | ✅ User can decrypt own | ✅ User can decrypt own | N/A |
| **Nonce tracking** | ✅ Yes (per operation) | ✅ Yes (per patient) | ❌ No |

**Takeaway:** Use encrypted error flags for DeFi/privacy-critical apps where operations must not revert on encrypted conditions. Use traditional reverts for simpler apps with plaintext validation.

### Batch Operation Strategies

| Aspect | ghostlend | APU | DripPay |
|--------|-----------|-----|---------|
| **Batch model** | Async (BatcherConfidential) | Sync (owner-driven) | Sync (owner-driven) |
| **Shared proof** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Gas optimization** | Complex (netting) | Simple (batch loop) | Simple (batch loop) |
| **Max batch size** | Unlimited (async) | 50 (gas limit) | No limit specified |
| **Use case** | Vault deposits/withdrawals | Healthcare provider batches | Payroll batches |

**Takeaway:** Use async batching (OpenZeppelin BatcherConfidential) for high-volume, permissionless operations. Use sync batching for admin/provider-driven workflows.

### SDK Integration Approach

| Aspect | ghostlend | APU | DripPay |
|--------|-----------|-----|---------|
| **Frontend SDK** | Custom (no hooks) | @zama-fhe/react-sdk@^3.3.0 | @zama-fhe/relayer-sdk@^0.4.1 (old) |
| **Encryption hooks** | Manual | useEncrypt | Manual fhevmjs |
| **Decryption hooks** | Manual | useDecryptValues | Manual EIP-712 |
| **Permit management** | Manual | useGrantPermit, useHasPermit | Manual |
| **Provider chain** | Custom | Wagmi → Query → Zama | Wagmi + custom |

**Takeaway:** **APU is most modern.** Use `@zama-fhe/react-sdk@^3.x` for new projects. ghostlend predates these hooks; DripPay uses deprecated SDK.

### Epoch Management Complexity

| Aspect | ghostlend | APU | DripPay |
|--------|-----------|-----|---------|
| **Epoch system** | ✅ Complex (3+ states) | ✅ Simple (2 states) | ❌ None |
| **Two-phase reveal** | ✅ Yes (close → finalize) | ✅ Yes (close → finalize) | N/A |
| **KMS integration** | ✅ Production (auto-finalize) | ✅ Ready (manual finalize) | N/A |
| **State machine** | ✅ Yes (None → Pending → Finalized) | ✅ Yes (same) | N/A |
| **Replay protection** | ✅ Status check | ✅ Status check | N/A |
| **Self-healing** | ✅ Event log recovery | ❌ No | N/A |

**Takeaway:** Implement two-phase epochs for any aggregate decryption use case. ghostlend adds self-healing for production resilience.

---

## Best Practices & Anti-Patterns

### ✅ Best Practices

#### 1. Baseline Aggregate Initialization
```solidity
// ✅ CORRECT
constructor() {
    encryptedAggregateSum = FHE.asEuint32(0); // Real encrypted zero
    FHE.allowThis(encryptedAggregateSum);
}

// ❌ WRONG
constructor() {
    // encryptedAggregateSum is bytes32(0) (null handle) - KMS will reject
}
```

#### 2. No Reverts on Encrypted Conditions
```solidity
// ✅ CORRECT
ebool sufficient = FHE.le(amount, balance);
euint32 newBalance = FHE.select(
    sufficient,
    FHE.sub(balance, amount), // If sufficient, subtract
    balance                   // Otherwise, unchanged
);

// ❌ WRONG
require(amount <= balance, "Insufficient"); // Can't check encrypted condition
```

#### 3. ACL Pattern for Privacy
```solidity
// ✅ CORRECT (individual privacy preserved)
individualSubmissions[patient] = encryptedValue;
FHE.allowThis(encryptedValue); // Contract can use
// NO FHE.allow(encryptedValue, anyone) - never decryptable

// Aggregate is decryptable
encryptedAggregateSum = FHE.add(encryptedAggregateSum, encryptedValue);
FHE.allow(encryptedAggregateSum, researcher);

// ❌ WRONG (privacy violated)
FHE.allow(encryptedValue, researcher); // Researcher can decrypt individual
```

#### 4. Storage-Based Handle Verification
```solidity
// ✅ CORRECT
function finalizeEpoch(uint256 id, bytes calldata cleartexts, bytes calldata proof) external {
    bytes32[] memory handles = new bytes32[](1);
    handles[0] = euint32.unwrap(publicEpochs[id].aggregateSnapshot); // From STORAGE
    FHE.checkSignatures(handles, cleartexts, proof);
}

// ❌ WRONG
function finalizeEpoch(bytes32 handle, bytes calldata cleartexts, bytes calldata proof) external {
    bytes32[] memory handles = new bytes32[](1);
    handles[0] = handle; // From CALLDATA - attacker can substitute
    FHE.checkSignatures(handles, cleartexts, proof);
}
```

#### 5. Batch Encryption with Shared Proof
```typescript
// ✅ CORRECT
const values = riskScores.map(s => ({ value: BigInt(s), type: "euint32" }));
const result = await encrypt({ values, contractAddress, userAddress });
// ONE proof for all values

// ❌ WRONG (unnecessary gas waste)
for (const score of riskScores) {
  const result = await encrypt({ values: [{ value: BigInt(score), type: "euint32" }], ... });
  // Separate proof for each value
}
```

#### 6. Provider Order (Frontend)
```tsx
// ✅ CORRECT
<WagmiProvider>
  <QueryClientProvider>  {/* BEFORE ZamaProvider */}
    <ZamaProvider>
      {children}
    </ZamaProvider>
  </QueryClientProvider>
</WagmiProvider>

// ❌ WRONG
<WagmiProvider>
  <ZamaProvider>
    <QueryClientProvider>  {/* AFTER ZamaProvider */}
      {children}
    </QueryClientProvider>
  </ZamaProvider>
</WagmiProvider>
```

#### 7. viaIR for Complex Contracts
```typescript
// ✅ CORRECT (for contracts with many FHE operations)
solidity: {
  version: "0.8.24",
  settings: {
    optimizer: { enabled: true, runs: 800 },
    viaIR: true, // Fixes stack too deep
    evmVersion: "cancun",
  },
}

// ❌ WRONG (will get "stack too deep" errors)
solidity: {
  version: "0.8.24",
  settings: {
    optimizer: { enabled: true, runs: 800 },
    // No viaIR
  },
}
```

### ❌ Anti-Patterns

#### 1. Null Handle Problem
```solidity
// ❌ ANTI-PATTERN
euint32 private aggregate; // Never initialized (null handle)

function reveal() external {
    FHE.makePubliclyDecryptable(aggregate); // KMS REJECTS null handle
}
```

#### 2. Encrypted Require
```solidity
// ❌ ANTI-PATTERN
function withdraw(euint32 amount) external {
    require(FHE.decrypt(FHE.le(amount, balance)), "Insufficient"); // Can't decrypt in require
}
```

#### 3. Missing ACL Permissions
```solidity
// ❌ ANTI-PATTERN
function store(externalEuint32 value, bytes calldata proof) external {
    euint32 encrypted = FHE.fromExternal(value, proof);
    mapping[msg.sender] = encrypted;
    // MISSING: FHE.allowThis(encrypted)
    // MISSING: FHE.allow(encrypted, msg.sender)
}
```

#### 4. Calldata Handle Verification
```solidity
// ❌ ANTI-PATTERN
function finalize(bytes32 handle, bytes calldata cleartexts, bytes calldata proof) external {
    bytes32[] memory handles = new bytes32[](1);
    handles[0] = handle; // Attacker controls this
    FHE.checkSignatures(handles, cleartexts, proof);
}
```

#### 5. Deprecated SDK Usage
```typescript
// ❌ ANTI-PATTERN
import { createInstance } from "fhevmjs"; // DEPRECATED

// ✅ USE INSTEAD
import { useEncrypt } from "@zama-fhe/react-sdk";
```

---

## Integration Architecture

### Data Flow (Patient → Researcher)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. PATIENT SUBMISSION                                           │
└─────────────────────────────────────────────────────────────────┘
   Patient (Browser)
      ↓ Risk Score: 75 (plaintext)
   [Client-side FHE Encryption] ← @zama-fhe/react-sdk WASM worker
      ↓ Handle: 0xabc123... + Proof: 0xdef456...
   [MetaMask Transaction]
      ↓ submitHealthData(handle, proof)
   Smart Contract (Sepolia)
      ├─ FHE.fromExternal(handle, proof) → euint32 riskScore
      ├─ Value capping: FHE.select(gt(riskScore, 100), 100, riskScore)
      ├─ Error flag: FHE.select(clamped, E_CLAMPED, E_OK)
      ├─ Store individual (NO ACL for decryption)
      └─ Update aggregate: FHE.add(aggregateSum, riskScore)

┌─────────────────────────────────────────────────────────────────┐
│ 2. AGGREGATE DECRYPTION REQUEST (Two-Phase)                    │
└─────────────────────────────────────────────────────────────────┘
   Researcher (Browser)
      ↓ Click "Close Epoch"
   [MetaMask Transaction]
      ↓ closePublicStatsEpoch()
   Smart Contract
      ├─ Snapshot aggregate + count
      ├─ FHE.makePubliclyDecryptable(aggregate) → KMS request
      └─ Status: None → Pending

   KMS Service (Zama Gateway)
      ↓ Async decryption (~2-5 minutes on devnet)
   [Gateway Event: ResultCallback]
      ↓ cleartexts: 0x..., proof: 0x...

   Anyone (Permissionless)
      ↓ Monitor Gateway events
   [MetaMask Transaction]
      ↓ finalizePublicStatsEpoch(epochId, cleartexts, proof)
   Smart Contract
      ├─ FHE.checkSignatures(handles, cleartexts, proof) ✅ Verify KMS
      ├─ Decode: sum = 415 (6 patients: 75+45+67+82+55+91)
      ├─ Calculate: average = 415 / 6 = 69
      └─ Status: Pending → Finalized

┌─────────────────────────────────────────────────────────────────┐
│ 3. PATIENT ERROR DECRYPTION (Individual, Private)              │
└─────────────────────────────────────────────────────────────────┘
   Patient (Browser)
      ↓ Click "View Status"
   [Grant Permit] ← useGrantPermit()
      ↓ EIP-712 signature (authorize re-encryption)
   [KMS Re-Encryption Request]
      ↓ errorHandle: 0x789...
   [Client-side Decryption] ← useDecryptValues()
      ↓ errorCode: 0 (E_OK) or 1 (E_CLAMPED)
   UI Display
      └─ "Status: OK" or "Status: CLAMPED (value exceeded 100)"
```

### Contract ↔ Frontend Synchronization

**ABI Synchronization Pattern:**

```bash
# Backend: Generate TypeChain types after compilation
cd fhevm-hardhat-template
npm run compile  # Compiles contracts + generates types/
npm run typechain  # Creates TypeScript bindings

# Frontend: Copy ABI and addresses
cp fhevm-hardhat-template/artifacts/contracts/HealthDataAggregator.sol/HealthDataAggregator.json \
   app-hackathon/lib/abis/HealthDataAggregator.json

# Frontend: Update addresses (app-hackathon/lib/addresses.ts)
export const ADDR = {
  healthDataAggregator: "0x780c06f807E5fB8768A0cD6648A28D8A621F0470",
};

# Frontend: Use typed ABIs (app-hackathon/lib/abis.ts)
import healthDataAggregatorJson from "./abis/HealthDataAggregator.json";
export const healthDataAggregatorAbi = healthDataAggregatorJson.abi as const;
```

**Automated sync (recommended):**

```json
// package.json (frontend)
{
  "scripts": {
    "sync-abis": "node scripts/sync-abis.js"
  }
}
```

```javascript
// scripts/sync-abis.js
const fs = require("fs");
const path = require("path");

const contractsDir = "../fhevm-hardhat-template/artifacts/contracts";
const outputDir = "./lib/abis";

// Copy all ABIs
fs.readdirSync(contractsDir, { recursive: true }).forEach(file => {
  if (file.endsWith(".json") && !file.includes(".dbg.")) {
    const content = JSON.parse(fs.readFileSync(path.join(contractsDir, file)));
    fs.writeFileSync(
      path.join(outputDir, path.basename(file)),
      JSON.stringify(content, null, 2)
    );
  }
});
```

---

## Gas Optimization Strategies

### 1. Batch Operations (DripPay Pattern)

**Gas Comparison (APU on Sepolia):**

- Single submission: **490,907 gas**
- Batch 5 submissions: **1,675,224 gas** (335,045 gas per patient)
- **Savings: 28% per patient** (490,907 vs 335,045)

**Why batching saves gas:**
1. Shared proof verification (one proof for all values)
2. Single transaction overhead
3. Fewer storage writes (aggregate updated once)

### 2. viaIR Optimizer (ghostlend Pattern)

**When to use:**
- Contracts with >10 FHE operations per function
- "Stack too deep" compilation errors

**Trade-offs:**
- Compilation time: 2-5x slower
- Deployment cost: Slightly higher bytecode size
- Runtime gas: Slightly better (optimized IR)

**ghostlend uses viaIR:** Complex lending with 30+ FHE ops per function
**DripPay doesn't:** Simple payroll with <10 FHE ops per function

### 3. Array-Based Employee Tracking (DripPay)

```solidity
// Storage layout
address[] private _employees; // Iterable list
mapping(address => bool) public isEmployee; // O(1) lookup

// Add employee
function addEmployee(address emp) external {
    _employees.push(emp);
    isEmployee[emp] = true;
}

// Remove employee (swap-and-pop, O(1) amortized)
function removeEmployee(address emp) external {
    for (uint256 i = 0; i < _employees.length; i++) {
        if (_employees[i] == emp) {
            _employees[i] = _employees[_employees.length - 1];
            _employees.pop();
            break;
        }
    }
    isEmployee[emp] = false;
}

// Iterate for payroll
function runPayroll() external {
    for (uint256 i = 0; i < _employees.length; i++) {
        // Process _employees[i]
    }
}
```

**Gas cost:** ~20k per employee add, ~15k per remove, ~100k per payroll (10 employees)

### 4. ACL Batching (Aggregate Pattern)

```solidity
// ❌ INEFFICIENT (per-submission ACL grants)
function submit(externalEuint32 value, bytes calldata proof) external {
    euint32 encrypted = FHE.fromExternal(value, proof);
    aggregate = FHE.add(aggregate, encrypted);

    FHE.allowThis(aggregate); // Gas cost: ~5k
    FHE.allow(aggregate, researcher); // Gas cost: ~5k
}
// Total: 10k per submission

// ✅ EFFICIENT (batch ACL grants after loop)
function submitBatch(externalEuint32[] calldata values, bytes calldata proof) external {
    for (uint i = 0; i < values.length; i++) {
        euint32 encrypted = FHE.fromExternal(values[i], proof);
        aggregate = FHE.add(aggregate, encrypted);
    }

    // ACL grants ONCE for final aggregate
    FHE.allowThis(aggregate); // Gas cost: ~5k (once)
    FHE.allow(aggregate, researcher); // Gas cost: ~5k (once)
}
// Total: 10k for entire batch
```

### 5. Minimal Reveal Surface (ghostlend GhostGate)

**ghostlend innovation:** Only reveal direction + net flow, not individual deposit/withdrawal amounts

```solidity
// Traditional approach (reveals too much)
FHE.makePubliclyDecryptable(totalDeposits); // Reveals deposit total
FHE.makePubliclyDecryptable(totalWithdrawals); // Reveals withdrawal total

// ghostlend approach (minimal reveal)
ebool depositWins = FHE.gt(totalDeposits, totalWithdrawals);
euint64 net = FHE.select(
    depositWins,
    FHE.sub(totalDeposits, totalWithdrawals),
    FHE.sub(totalWithdrawals, totalDeposits)
);

FHE.makePubliclyDecryptable(depositWins); // 1 bit (direction)
FHE.makePubliclyDecryptable(net); // 64 bits (absolute difference)
// Total reveal: 65 bits vs 128 bits (50% reduction)
```

**KMS decryption cost:** Proportional to number of handles decrypted. Minimize revealed values.

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] **Solidity version:** Use 0.8.24 or 0.8.27 (latest stable)
- [ ] **Optimizer enabled:** `runs: 800` for balanced gas
- [ ] **viaIR:** Set `true` if contract has >10 FHE ops per function
- [ ] **evmVersion:** Set `"cancun"` for latest features
- [ ] **Test coverage:** 100% of critical paths (encryption, decryption, epochs)
- [ ] **Mock mode tests:** All tests pass in mock mode (fast iteration)
- [ ] **Sepolia tests:** Integration tests pass on Sepolia (real FHE)
- [ ] **Gas profiling:** Run `REPORT_GAS=true npm test` and analyze
- [ ] **Security audit:** Review ACL permissions, ensure individual privacy
- [ ] **Baseline aggregates:** All aggregate variables initialized to `FHE.asEuint32(0)`
- [ ] **No encrypted reverts:** Use `FHE.select()` instead of `require()` on encrypted conditions

### Deployment

- [ ] **Deployment script:** Use `hardhat-deploy` for reproducible deployments
- [ ] **Environment variables:** Set `PRIVATE_KEY`, `INFURA_API_KEY`, `ETHERSCAN_API_KEY`
- [ ] **Network selection:** Deploy to Sepolia first, then Zama devnet, then mainnet
- [ ] **Contract verification:** Verify on Etherscan immediately after deployment
- [ ] **Initial state:** Set owner, authorize initial researcher, baseline aggregates
- [ ] **ABI export:** Save ABI to frontend (`lib/abis/ContractName.json`)
- [ ] **Address export:** Update frontend addresses (`lib/addresses.ts`)
- [ ] **Transaction logs:** Save deployment TX hash, block number, gas used

### Post-Deployment (Sepolia)

- [ ] **Smoke test:** Submit one encrypted value, verify storage
- [ ] **Batch test:** Submit batch, measure gas
- [ ] **Epoch test:** Close epoch, verify KMS request (may timeout on Sepolia)
- [ ] **Error flag test:** Submit duplicate, verify error decryption
- [ ] **Frontend integration:** Connect wallet, submit from UI
- [ ] **E2E flow:** Patient submit → Researcher request → KMS decrypt → View result

### Post-Deployment (Zama Devnet)

- [ ] **KMS integration:** Full two-phase epoch finalization (2-5 minute response)
- [ ] **Automated monitoring:** Deploy `monitor-kms.ts` as service
- [ ] **Multi-epoch test:** Close → Finalize → Advance → Repeat
- [ ] **Stress test:** 50 submissions, verify aggregate accuracy
- [ ] **Failure recovery:** Test what happens if KMS times out (manual finalize)

### Post-Deployment (Mainnet)

- [ ] **Final audit:** External security audit recommended
- [ ] **Mainnet faucet:** Ensure deployer has sufficient ETH
- [ ] **Gas price:** Monitor gas prices, deploy during low congestion
- [ ] **Deployment:** Use same script as Sepolia/devnet (reproducible)
- [ ] **Verification:** Verify on Etherscan mainnet
- [ ] **Initial funding:** Fund contract if needed (e.g., oracle fees)
- [ ] **Monitoring:** Set up alerts for contract events
- [ ] **Documentation:** Update README with mainnet addresses
- [ ] **Announcement:** Announce deployment on social media, Discord, etc.

### Frontend Deployment

- [ ] **Environment variables:** Set `NEXT_PUBLIC_CONTRACT_ADDRESS`, etc.
- [ ] **Build test:** `npm run build` succeeds
- [ ] **WASM check:** Verify `asyncWebAssembly: true` in webpack config
- [ ] **CORS headers:** Verify COOP/COEP headers in production
- [ ] **Provider order:** Verify Wagmi → Query → Zama order
- [ ] **reactStrictMode:** Set `false` (Zama SDK incompatible)
- [ ] **Deploy platform:** Vercel/Netlify with correct headers
- [ ] **SSL:** Ensure HTTPS (required for SharedArrayBuffer)
- [ ] **E2E test:** Full user flow in production environment

---

## Appendix: Version Matrix

### Confirmed Working Versions (APU - Production)

**Backend:**
```json
{
  "@fhevm/solidity": "^0.11.1",
  "@fhevm/hardhat-plugin": "^0.4.2",
  "@fhevm/mock-utils": "^0.4.2",
  "@zama-fhe/sdk": "^3.3.0",
  "hardhat": "^2.26.0",
  "ethers": "^6.15.0",
  "chai": "^4.5.0",
  "typescript": "^5.8.3"
}
```

**Frontend:**
```json
{
  "@zama-fhe/react-sdk": "^3.3.0",
  "@zama-fhe/sdk": "^3.2.0",
  "wagmi": "^2.14.0",
  "viem": "^2.21.0",
  "@rainbow-me/rainbowkit": "^2.2.11",
  "@tanstack/react-query": "^5.101.4",
  "next": "15.5.2",
  "react": "19.1.0",
  "ethers": "^6.15.0"
}
```

### Confirmed Working Versions (ghostlend - Mainnet)

**Backend:**
```json
{
  "@fhevm/solidity": "^0.11.1",
  "@fhevm/hardhat-plugin": "^0.4.2",
  "@openzeppelin/confidential-contracts": "^0.5.1",
  "hardhat": "^2.28.6",
  "ethers": "^6.16.0"
}
```

### Confirmed Working Versions (DripPay - Hackathon)

**Backend:**
```json
{
  "@fhevm/solidity": "^0.11.1",
  "@fhevm/hardhat-plugin": "^0.4.1",
  "hardhat": "^2.22.17",
  "ethers": "^6.13.4"
}
```

**Frontend:**
```json
{
  "@zama-fhe/relayer-sdk": "^0.4.1",
  "wagmi": "^2.19.5",
  "viem": "^2.46.3",
  "next": "16.1.6",
  "react": "19.2.3"
}
```

---

## Conclusion

This guide synthesizes battle-tested patterns from three production fhEVM implementations:

1. **APU Health Data Platform** - Modern SDK, public statistics epochs, privacy-preserving aggregation
2. **ghostlend** - Mainnet-deployed DeFi, complex state machines, minimal reveal surface
3. **DripPay** - Hackathon winner, batch operations, encrypted payroll

**Key Takeaways:**

- **Always initialize aggregates** with `FHE.asEuint32(0)`, never leave null
- **Use encrypted error flags** for privacy-critical applications
- **Implement two-phase epochs** for any aggregate decryption
- **Batch operations save gas** through shared proofs
- **Frontend: Use modern SDK** (@zama-fhe/react-sdk@^3.x, not deprecated relayer)
- **Provider order matters** (Wagmi → Query → Zama)
- **viaIR for complex contracts** (>10 FHE ops per function)
- **Minimal reveal surface** (only decrypt what's necessary)

**For new projects starting in 2026:**

✅ Use APU's dependency versions (most current)
✅ Use APU's frontend SDK (@zama-fhe/react-sdk)
✅ Use ghostlend's error handling patterns (encrypted flags)
✅ Use DripPay's batch operation patterns (shared proof)
✅ Implement two-phase epochs for aggregate decryption
✅ Test on Sepolia first, then Zama devnet for KMS testing

---

## Appendix: Complete Dependency Lists

### APU Backend - Complete npm list Output

```
fhevm-hardhat-template@0.0.1
├── @fhevm/hardhat-plugin@0.4.2
├── @fhevm/mock-utils@0.4.2
├── @fhevm/solidity@0.11.1
├── @nomicfoundation/hardhat-chai-matchers@2.1.2
├── @nomicfoundation/hardhat-ethers@3.1.3
├── @nomicfoundation/hardhat-network-helpers@1.1.2
├── @nomicfoundation/hardhat-verify@2.1.3
├── @typechain/ethers-v6@0.5.1
├── @typechain/hardhat@9.1.0
├── @types/chai@4.3.20
├── @types/mocha@10.0.10
├── @types/node@20.19.43
├── @typescript-eslint/eslint-plugin@8.65.0
├── @typescript-eslint/parser@8.65.0
├── @zama-fhe/oracle-solidity@0.1.0
├── @zama-fhe/relayer-sdk@0.4.1
├── @zama-fhe/sdk@3.3.0
├── chai-as-promised@8.0.2
├── chai@4.5.0
├── cross-env@7.0.3
├── encrypted-types@0.0.4
├── eslint-config-prettier@9.1.2
├── eslint@8.57.1
├── ethers@6.17.0
├── fhevmjs@0.6.2
├── hardhat-deploy@0.11.45
├── hardhat-gas-reporter@2.3.0
├── hardhat@2.29.0
├── mocha@11.7.6
├── prettier-plugin-solidity@2.3.1
├── prettier@3.9.6
├── rimraf@6.1.3
├── solhint@6.2.3
├── solidity-coverage@0.8.17
├── ts-generator@0.1.1
├── ts-node@10.9.2
├── typechain@8.3.2
└── typescript@5.9.3
```

**Total packages:** 37

### APU Frontend - Complete npm list Output

```
app-hackathon@0.1.0
├── @eslint/eslintrc@3.3.1
├── @radix-ui/react-alert-dialog@1.1.15
├── @radix-ui/react-avatar@1.1.10
├── @radix-ui/react-checkbox@1.3.3
├── @radix-ui/react-label@2.1.7
├── @radix-ui/react-separator@1.1.7
├── @radix-ui/react-slot@1.2.3
├── @radix-ui/react-tabs@1.1.13
├── @rainbow-me/rainbowkit@2.2.11
├── @tailwindcss/postcss@4.1.12
├── @tanstack/react-query@5.101.4
├── @types/node@20.19.11
├── @types/react-dom@19.1.9
├── @types/react@19.1.12
├── @x402/core@2.20.0
├── @x402/evm@2.20.0
├── @x402/svm@2.20.0
├── @zama-fhe/react-sdk@3.3.0
├── @zama-fhe/sdk@3.3.0
├── class-variance-authority@0.7.1
├── clsx@2.1.1
├── eslint-config-next@15.5.2
├── eslint@9.34.0
├── ethers@6.15.0
├── framer-motion@12.23.12
├── lucide-react@0.542.0
├── next@15.5.2
├── react-dom@19.1.0
├── react@19.1.0
├── recharts@3.1.2
├── tailwind-merge@3.3.1
├── tailwindcss@4.1.12
├── tw-animate-css@1.3.7
├── typescript@5.9.2
├── viem@2.55.10
└── wagmi@2.19.5
```

**Total packages:** 36

### ghostlend Backend - Complete Dependency List

```
ghostlend-backend
├── @eslint/js@9.39.2
├── @fhevm/hardhat-plugin@0.4.2
├── @fhevm/mock-utils@0.4.2
├── @fhevm/solidity@0.11.1
├── @nomicfoundation/hardhat-chai-matchers@2.1.0
├── @nomicfoundation/hardhat-ethers@3.1.3
├── @nomicfoundation/hardhat-network-helpers@1.1.2
├── @nomicfoundation/hardhat-verify@2.1.3
├── @openzeppelin/confidential-contracts@0.5.1
├── @openzeppelin/contracts@5.6.1
├── @typechain/ethers-v6@0.5.1
├── @typechain/hardhat@9.1.0
├── @types/chai@4.3.20
├── @types/mocha@10.0.10
├── @types/node@20.19.30
├── @zama-fhe/relayer-sdk@0.4.1
├── chai-as-promised@8.0.2
├── chai@4.5.0
├── cross-env@7.0.3
├── encrypted-types@0.0.4
├── eslint-config-prettier@10.1.8
├── eslint@9.39.2
├── ethers@6.16.0
├── globals@17.6.0
├── hardhat-deploy@0.11.45
├── hardhat-gas-reporter@2.3.0
├── hardhat@2.28.6
├── mocha@11.7.5
├── prettier-plugin-solidity@2.3.1
├── prettier@3.8.3
├── rimraf@6.1.3
├── solhint@6.2.1
├── solidity-coverage@0.8.17
├── ts-generator@0.1.1
├── ts-node@10.9.2
├── typechain@8.3.2
├── typescript-eslint@8.59.1
└── typescript@5.9.3
```

**Total packages:** 38

### ghostlend Frontend - Complete Dependency List

```
ghostlend-frontend
├── @tanstack/react-query@5.62.0
├── @types/node@22.10.0
├── @types/react-dom@19.0.0
├── @types/react@19.0.0
├── @zama-fhe/react-sdk@3.2.0
├── @zama-fhe/sdk@3.2.0
├── next@16.2.10
├── react-dom@19.0.0
├── react@19.0.0
├── typescript@5.7.0
├── viem@2.21.0
└── wagmi@2.14.0
```

**Total packages:** 12 (minimal, focused)

### DripPay Contract - Complete Dependency List

```
drippay-contract
├── @fhevm/hardhat-plugin@0.4.1
├── @fhevm/mock-utils@0.4.2
├── @fhevm/solidity@0.11.1
├── @nomicfoundation/hardhat-chai-matchers@2.0.8
├── @nomicfoundation/hardhat-ethers@3.0.8
├── @nomicfoundation/hardhat-verify@2.0.12
├── @openzeppelin/contracts@5.6.1
├── @typechain/ethers-v6@0.5.1
├── @typechain/hardhat@9.1.0
├── @types/chai@4.3.20
├── @types/mocha@10.0.10
├── @types/node@22.10.0
├── chai@4.5.0
├── dotenv@16.4.7
├── encrypted-types@0.0.4
├── ethers@6.13.4
├── hardhat-deploy@0.14.0
├── hardhat-gas-reporter@2.2.2
├── hardhat@2.22.17
├── ts-node@10.9.2
├── typechain@8.3.2
└── typescript@5.7.2
```

**Total packages:** 22

### DripPay Frontend - Complete Dependency List

```
drippay-frontend
├── @rainbow-me/rainbowkit@2.2.10
├── @tailwindcss/postcss@4
├── @tanstack/react-query@5.90.21
├── @types/node@20
├── @types/react-dom@19
├── @types/react@19
├── @zama-fhe/relayer-sdk@0.4.1
├── babel-plugin-react-compiler@1.0.0
├── eslint-config-next@16.1.6
├── eslint@9
├── ethers@6.16.0
├── framer-motion@12.34.4
├── lucide-react@0.576.0
├── next@16.1.6
├── react-dom@19.2.3
├── react@19.2.3
├── tailwindcss@4
├── typescript@5
├── viem@2.46.3
└── wagmi@2.19.5
```

**Total packages:** 20

### Version Migration Paths

#### From DripPay (Deprecated SDK) → APU (Modern SDK)

**Impact:** MAJOR (API breaking changes)
**Estimated Time:** 2-4 hours (small app) to 1-2 days (large app)
**Difficulty:** Medium

**Step-by-step migration:**

1. **Update package.json dependencies:**
```diff
{
  "dependencies": {
-   "@zama-fhe/relayer-sdk": "^0.4.1",
+   "@zama-fhe/react-sdk": "^3.3.0",
+   "@zama-fhe/sdk": "^3.3.0",
    "wagmi": "^2.19.5",
-   "viem": "^2.46.3",
+   "viem": "^2.55.10",
    "@rainbow-me/rainbowkit": "^2.2.11",
+   "@tanstack/react-query": "^5.101.4"
  }
}
```

2. **Add provider hierarchy (app/providers.tsx):**
```typescript
// NEW PATTERN
import { ZamaProvider } from "@zama-fhe/react-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ZamaProvider config={zamaConfig}>
            {children}
          </ZamaProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

3. **Replace manual encryption:**
```typescript
// OLD (DripPay)
const instance = await getFhevmInstance();
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add64(value);
const encrypted = await input.encrypt();

// NEW (APU)
import { useEncrypt } from "@zama-fhe/react-sdk";
const { mutateAsync: encrypt } = useEncrypt();
const result = await encrypt({
  values: [{ value: BigInt(value), type: "euint64" }],
  contractAddress,
  userAddress: address,
});
```

4. **Replace manual decryption:**
```typescript
// OLD (DripPay - manual EIP-712)
const { publicKey, privateKey } = instance.generateKeypair();
const eip712 = instance.createEIP712(publicKey, [contractAddress], now, 1);
const signature = await walletClient.signTypedData({ ...eip712 });
const results = await instance.userDecrypt(/* ... */);

// NEW (APU - hooks)
import { useDecryptValues, useGrantPermit } from "@zama-fhe/react-sdk";
const { mutateAsync: grantPermit } = useGrantPermit();
const { data } = useDecryptValues([
  { encryptedValue: handle, contractAddress }
]);
```

#### From ghostlend SDK 3.2.0 → APU SDK 3.3.0

**Impact:** MINOR (backward compatible)
**Estimated Time:** 15-30 minutes
**Difficulty:** Low

**Step-by-step migration:**

1. **Update package.json:**
```diff
{
  "dependencies": {
-   "@zama-fhe/react-sdk": "^3.2.0",
+   "@zama-fhe/react-sdk": "^3.3.0",
-   "@zama-fhe/sdk": "^3.2.0",
+   "@zama-fhe/sdk": "^3.3.0"
  }
}
```

2. **Install and test:**
```bash
npm install
npm run build
npm run test
```

3. **No code changes required** (backward compatible)

#### Backend: DripPay hardhat 2.22.17 → APU hardhat 2.29.0

**Impact:** MINOR (backward compatible)
**Estimated Time:** 30 minutes
**Difficulty:** Low

**Step-by-step migration:**

1. **Update package.json:**
```diff
{
  "devDependencies": {
-   "hardhat": "^2.22.17",
+   "hardhat": "^2.29.0",
-   "@fhevm/hardhat-plugin": "^0.4.1",
+   "@fhevm/hardhat-plugin": "^0.4.2",
-   "@nomicfoundation/hardhat-ethers": "^3.0.8",
+   "@nomicfoundation/hardhat-ethers": "^3.1.3",
-   "@nomicfoundation/hardhat-chai-matchers": "^2.0.8",
+   "@nomicfoundation/hardhat-chai-matchers": "^2.1.2",
-   "ethers": "^6.13.4",
+   "ethers": "^6.17.0"
  }
}
```

2. **Install and test:**
```bash
npm install
npm test
```

3. **Verify compilation:**
```bash
npm run compile
```

### Version Conflict Resolution

#### Common Issues and Solutions

**Issue 1: chai v5 installed (incompatible with hardhat-chai-matchers)**

```bash
# Error: Cannot find module 'chai/lib/chai/assertion'
# Solution:
npm install chai@^4.5.0 --save-dev
```

**Issue 2: Provider order wrong (ZamaProvider above QueryClientProvider)**

```bash
# Error: No QueryClient set, use QueryClientProvider to set one
# Solution: Ensure QueryClientProvider wraps ZamaProvider
```

**Issue 3: WASM not loading (missing asyncWebAssembly config)**

```bash
# Error: WebAssembly module is included in initial chunk
# Solution: Add to next.config.ts:
config.experiments = {
  ...config.experiments,
  asyncWebAssembly: true,
};
```

**Issue 4: CORS errors (missing headers)**

```bash
# Error: SharedArrayBuffer is not defined
# Solution: Add to next.config.ts:
async headers() {
  return [{
    source: "/(.*)",
    headers: [
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
    ],
  }];
}
```

---

**Document Version:** 1.0
**Last Updated:** 2026-07-30
**Maintained By:** APU Team
**License:** MIT
**Contact:** See repository for issues/questions
