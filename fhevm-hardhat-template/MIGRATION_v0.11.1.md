# Migration to fhEVM v0.11.1 (Winner Stack)

**Date:** 2026-07-28
**Status:** ✅ COMPLETE
**Result:** All 48 tests passing

## Context

Migrated from the template stack (v0.7.0) to the **hackathon winner stack** (v0.11.1), which is production-proven by 14 winning projects from PL Genesis Hackathon and Mainnet Season 3.

## Dependencies Changed

### Backend (package.json)

```diff
{
  "dependencies": {
-   "@fhevm/solidity": "^0.7.0",
+   "@fhevm/solidity": "^0.11.1",
    "encrypted-types": "^0.0.4",
    "fhevmjs": "^0.6.2"  // DEPRECATED (will migrate frontend separately)
  },
  "devDependencies": {
-   "@fhevm/hardhat-plugin": "^0.0.1-6",
+   "@fhevm/hardhat-plugin": "^0.4.2",
+   "@fhevm/mock-utils": "^0.4.2",  // NEW
-   "@zama-fhe/relayer-sdk": "^0.1.2",
+   "@zama-fhe/relayer-sdk": "0.4.1",
-   "ethers": "^6.13.4",
+   "ethers": "^6.15.0",
-   "hardhat": "^2.22.10"
+   "hardhat": "^2.26.0"
  }
}
```

## Breaking Changes Fixed

### 1. Config Class Rename

**Error:**
```
DeclarationError: Declaration "SepoliaConfig" not found in "@fhevm/solidity/config/ZamaConfig.sol"
```

**Fix:**
```diff
- import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
+ import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

- contract MyContract is SepoliaConfig {
+ contract MyContract is ZamaEthereumConfig {
```

**Files updated:**
- `contracts/FHECounter.sol:5,10`
- `contracts/HealthDataAggregator.sol:5,11`
- `contracts/MedicalRecords.sol:5,9`

### 2. Async Decryption API Overhaul

**Error:**
```
TypeError: Member "requestDecryption" not found or not visible after argument-dependent lookup in type(library FHE)
```

**Root cause:** Complete redesign of async decryption flow from automatic callbacks to manual KMS verification.

#### v0.7.0 Pattern (OLD - DEPRECATED)

```solidity
function requestDecryption() external returns (uint256 requestId) {
    bytes32[] memory handles = new bytes32[](1);
    handles[0] = euint32.unwrap(encryptedValue);

    // Automatic callback registration
    requestId = FHE.requestDecryption(handles, this.fulfillCallback.selector);
    emit DecryptionRequested(requestId);
}

// Automatic callback (called by Gateway)
function fulfillCallback(
    uint256 requestId,
    uint32 decryptedValue,  // Already decoded!
    bytes[] memory signatures
) public {
    FHE.checkSignatures(requestId, signatures);  // Wrong signature!
    emit Decrypted(requestId, decryptedValue);
}
```

#### v0.11.1 Pattern (NEW - PRODUCTION)

```solidity
// State variables for manual request tracking
uint256 private nextRequestId;
mapping(uint256 => bool) private fulfilledRequests;

function requestDecryption() external returns (uint256 requestId) {
    // Step 1: Mark ciphertext for public decryption
    FHE.makePubliclyDecryptable(encryptedValue);

    // Step 2: Generate request ID and emit handle for off-chain relayer
    requestId = nextRequestId++;
    bytes32 handle = euint32.unwrap(encryptedValue);
    emit DecryptionRequested(requestId, handle);
}

// Permissionless callback (called by anyone, typically relayer)
function fulfillCallback(
    uint256 requestId,
    bytes calldata cleartexts,  // ABI-encoded, NOT decoded!
    bytes calldata decryptionProof  // KMS signatures
) external {
    // Step 1: Replay protection (checkSignatures has NO built-in replay guard)
    require(!fulfilledRequests[requestId], "Already fulfilled");

    // Step 2: Rebuild handle list from STORAGE (not calldata) for security
    bytes32[] memory handles = new bytes32[](1);
    handles[0] = euint32.unwrap(encryptedValue);

    // Step 3: Verify KMS signatures
    FHE.checkSignatures(handles, cleartexts, decryptionProof);

    // Step 4: Manually decode cleartext
    uint32 decryptedValue = uint32(abi.decode(cleartexts, (uint256)));

    // Step 5: Mark as fulfilled
    fulfilledRequests[requestId] = true;

    emit Decrypted(requestId, decryptedValue);
}
```

#### Key Differences

| Aspect | v0.7.0 (OLD) | v0.11.1 (NEW) |
|--------|--------------|---------------|
| **API** | `FHE.requestDecryption(handles, selector)` | `FHE.makePubliclyDecryptable(value)` |
| **Callback registration** | Automatic via function selector | Manual event emission |
| **Callback permissions** | Called by Gateway only | Permissionless (anyone can call) |
| **Replay protection** | Built-in (by requestId) | Manual (requires state variable) |
| **Value decoding** | Automatic | Manual (`abi.decode`) |
| **Signature verification** | `checkSignatures(requestId, sigs)` | `checkSignatures(handles, cleartexts, proof)` |
| **Handle source** | Passed via calldata | Rebuilt from storage (security) |

**File updated:** `contracts/HealthDataAggregator.sol:143-189`

## Validation

### Compilation
```bash
npx hardhat compile
# ✅ Compiled 7 Solidity files successfully (evm target: cancun)
```

### Tests
```bash
npx hardhat test
# ✅ 48 passing (12s)
# ⏭️  7 pending (Sepolia-specific tests)
```

### Test Breakdown
- **FHECounter**: 3 tests ✅
- **HealthDataAggregator**: 22 tests ✅ (including security proofs)
- **MedicalRecords**: 23 tests ✅

## Security Implications

### Positive Changes
1. **Explicit decryption marking**: `makePubliclyDecryptable()` makes it obvious which values are being revealed
2. **Permissionless callbacks**: Anyone can fulfill (reduces centralization risk)
3. **Storage-based handle reconstruction**: Prevents calldata manipulation attacks

### New Responsibilities
1. **Manual replay protection**: Must track `fulfilledRequests` mapping
2. **Manual value decoding**: Must use correct ABI type (uint32 vs uint256)
3. **Event emission for relayer**: Must emit handle + requestId for off-chain decryption

## Reference Implementations

All winner projects use identical patterns:

- **Ghostlend** (Mainnet S3 2nd place): `contracts/ProbeSink.sol:68-82`
- **DripPay** (PL Genesis winner): Similar pattern
- **null402** (PL Genesis winner): Similar pattern
- **ZDrive** (PL Genesis winner): Similar pattern
- **Confidential X4PN dVPN** (PL Genesis winner): Similar pattern

## Next Steps

- [x] Backend migration complete
- [ ] Frontend migration to `@zama-fhe/sdk v3.2.0` (Phase E)
- [ ] Deploy to Sepolia (Phase D)
- [ ] E2E testing on testnet (Phase E)

## Resources

- **Winner Stack Analysis**: See `HACKATHON_WINNER_STACK.md`
- **v0.11.1 FHE.sol**: `node_modules/@fhevm/solidity/lib/FHE.sol:9049,9495`
- **Ghostlend Reference**: `/apu/mainnet-s3-winners/ghostlend/contracts/`
