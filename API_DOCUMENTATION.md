# APU Medical AI - API Documentation

Complete reference for all API endpoints, smart contract functions, and integration patterns.

## Table of Contents

1. [API Routes](#api-routes)
2. [Smart Contract Interface](#smart-contract-interface)
3. [0G Storage Integration](#0g-storage-integration)
4. [0G Compute Integration](#0g-compute-integration)
5. [FHE Encryption](#fhe-encryption)
6. [Authentication](#authentication)

---

## API Routes

All API routes are located in `app/src/app/api/`.

### POST /api/submit

Submit encrypted patient data to both networks.

**Request Body**:
```typescript
{
  patientAddress: string;         // Patient wallet address
  encryptedRiskScore: string;     // FHE encrypted risk score (hex)
  proof: string;                  // ZK proof for FHE (hex)
  symptoms: string;               // Patient symptoms
  medicalHistory: object;         // Medical history JSON
}
```

**Response**:
```typescript
{
  success: boolean;
  transactionHash: string;        // Sepolia TX hash
  diagnosisId: string;            // Unique diagnosis ID
  networks: {
    sepolia: {
      submitTx: string;           // Submission TX hash
      diagnosisTx: string;        // Diagnosis TX hash
      contract: string;           // Contract address
      explorer: string;           // Etherscan URL
    };
    og: {
      storageRoot: string;        // 0G Storage Merkle root
      computeRequestId: string;   // 0G Compute request ID
    };
  };
}
```

**Example**:
```typescript
const response = await fetch("/api/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    patientAddress: "0x1234...",
    encryptedRiskScore: "a1b2c3...",
    proof: "d4e5f6...",
    symptoms: "Fever, headache",
    medicalHistory: { allergies: ["penicillin"] }
  })
});

const result = await response.json();
console.log("TX Hash:", result.transactionHash);
```

**Workflow**:
1. Derives encryption key from patient signature
2. Uploads medical history to 0G Storage (AES-256-GCM)
3. Submits encrypted risk score to Sepolia contract (FHE)
4. Links both via `ogStorageRoot`
5. Triggers AI diagnosis on 0G Compute (TEE)
6. Stores encrypted diagnosis on Sepolia

**Error Responses**:
- `400` - Invalid request data (Zod validation failed)
- `500` - Internal server error (storage, blockchain, or compute failure)

---

### GET /api/patients

Fetch pending patient diagnoses (doctor only).

**Query Parameters**: None

**Response**:
```typescript
{
  patients: Array<{
    address: string;              // Patient wallet address
    submittedAt: string;          // ISO timestamp
    diagnosed: boolean;           // Diagnosis complete
    ogStorageRoot: string;        // 0G Storage reference
  }>;
}
```

**Example**:
```typescript
const response = await fetch("/api/patients");
const { patients } = await response.json();

patients.forEach(patient => {
  console.log(`Patient: ${patient.address}`);
  console.log(`Status: ${patient.diagnosed ? "Diagnosed" : "Pending"}`);
});
```

**Authorization**: Currently returns mock data. In production, should verify doctor authorization on-chain.

---

### POST /api/diagnose

Request diagnosis for a specific patient (doctor only).

**Request Body**:
```typescript
{
  patientAddress: string;         // Patient to diagnose
  doctorAddress: string;          // Requesting doctor
}
```

**Response**:
```typescript
{
  success: boolean;
  diagnosis: string;              // Diagnosis text
  confidence: number;             // Confidence score (0-1)
  encryptedData: string;          // Encrypted diagnosis data
}
```

**Example**:
```typescript
const response = await fetch("/api/diagnose", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    patientAddress: "0x1234...",
    doctorAddress: "0x5678..."
  })
});

const { diagnosis, confidence } = await response.json();
console.log(`Diagnosis: ${diagnosis} (${confidence * 100}% confident)`);
```

**Workflow**:
1. Verifies doctor is authorized on-chain
2. Requests decryption from KMS Gateway
3. Fetches medical history from 0G Storage
4. Retrieves AI diagnosis result
5. Returns encrypted data to authorized doctor

**Error Responses**:
- `400` - Invalid request data
- `403` - Doctor not authorized
- `500` - Internal server error

---

## Smart Contract Interface

### MedicalDataRegistry.sol

Deployed on Sepolia at: `process.env.MEDICAL_REGISTRY_ADDRESS`

#### submitPatientData

Submit encrypted patient data with proof.

```solidity
function submitPatientData(
    bytes calldata encryptedRiskScore,
    bytes calldata proof,
    bytes32 ogStorageRoot
) external nonReentrant
```

**Parameters**:
- `encryptedRiskScore`: FHE encrypted euint32 (from client)
- `proof`: ZK proof for FHE encryption
- `ogStorageRoot`: Merkle root from 0G Storage

**Emits**: `PatientDataSubmitted(address indexed patient, bytes32 ogStorageRoot, uint40 timestamp)`

**Example** (ethers.js):
```typescript
const tx = await medicalRegistry.submitPatientData(
  encryptedRiskScore,
  proof,
  ogStorageRoot,
  { gasLimit: 3_000_000 }
);
await tx.wait();
```

#### storeDiagnosis

Store AI diagnosis result (authorized doctors only).

```solidity
function storeDiagnosis(
    address patient,
    bytes calldata encryptedDiagnosis,
    bytes calldata proof,
    bytes calldata teeSignature
) external onlyAuthorizedDoctor nonReentrant
```

**Parameters**:
- `patient`: Patient address
- `encryptedDiagnosis`: FHE encrypted diagnosis code
- `proof`: ZK proof
- `teeSignature`: 0G Compute TEE signature

**Emits**: `DiagnosisStored(address indexed patient, uint40 timestamp)`

**Requires**: `msg.sender` is authorized doctor

#### authorizeDoctor

Authorize a doctor to access encrypted data (owner only).

```solidity
function authorizeDoctor(address doctor) external onlyOwner
```

**Emits**: `DoctorAuthorized(address indexed doctor)`

#### Events

```solidity
event PatientDataSubmitted(address indexed patient, bytes32 ogStorageRoot, uint40 timestamp);
event DiagnosisStored(address indexed patient, uint40 timestamp);
event DoctorAuthorized(address indexed doctor);
event DoctorRevoked(address indexed doctor);
```

---

## 0G Storage Integration

### OGStorageService

Located in `packages/backend/src/services/og-storage.service.ts`.

#### uploadEncrypted

Upload encrypted data to 0G Storage.

```typescript
async uploadEncrypted(params: {
  data: unknown;
  key: Buffer;
  tags?: string[];
}): Promise<{ ok: UploadResult } | { error: string }>
```

**Parameters**:
- `data`: Any JSON-serializable data
- `key`: AES-256-GCM encryption key (32 bytes)
- `tags`: Optional tags for indexing

**Returns**:
- `ok.merkleRoot`: Storage Merkle root (bytes32)
- `ok.txHash`: 0G network transaction hash

**Encryption**: AES-256-GCM with format: `[IV(12) | AuthTag(16) | Ciphertext]`

**Example**:
```typescript
const storage = new OGStorageService();
const key = await deriveEncryptionKey(signature);

const result = await storage.uploadEncrypted({
  data: { symptoms: "fever", history: {...} },
  key,
  tags: ["medical-history"]
});

if ("ok" in result) {
  console.log("Merkle Root:", result.ok.merkleRoot);
}
```

#### downloadAndDecrypt

Download and decrypt data from 0G Storage.

```typescript
async downloadAndDecrypt(params: {
  merkleRoot: string;
  key: Buffer;
}): Promise<{ ok: unknown } | { error: string }>
```

**Parameters**:
- `merkleRoot`: Storage Merkle root (from Sepolia contract)
- `key`: Same AES key used for encryption

**Returns**: Decrypted JSON data

**Example**:
```typescript
const result = await storage.downloadAndDecrypt({
  merkleRoot: "0xabcd...",
  key
});

if ("ok" in result) {
  console.log("Medical History:", result.ok);
}
```

---

## 0G Compute Integration

### OGComputeService

Located in `packages/backend/src/services/og-compute.service.ts`.

#### runDiagnosisInference

Run AI diagnosis in secure TEE.

```typescript
async runDiagnosisInference(params: {
  symptoms: string;
  medicalHistory: any;
  requestId: string;
}): Promise<{ ok: DiagnosisResult } | { error: string }>
```

**Parameters**:
- `symptoms`: Patient symptoms
- `medicalHistory`: Medical history object
- `requestId`: Unique request identifier

**Returns**:
```typescript
{
  ok: {
    diagnosis: string;          // Diagnosis text
    confidence: number;         // 0-1 confidence score
    teeSignature: Uint8Array;   // TEE attestation signature
  }
}
```

**TEE Attestation**: Result includes SGX signature proving execution in trusted environment.

**Example**:
```typescript
const compute = new OGComputeService();

const result = await compute.runDiagnosisInference({
  symptoms: "fever, headache",
  medicalHistory: { age: 35, allergies: [] },
  requestId: ethers.hexlify(ethers.randomBytes(16))
});

if ("ok" in result) {
  console.log("Diagnosis:", result.ok.diagnosis);
  console.log("TEE Signature:", result.ok.teeSignature);
}
```

---

## FHE Encryption

### Client-Side Encryption

Located in `app/src/lib/fhe.ts`.

#### encryptNumber

Encrypt a number with FHE (client-side).

```typescript
async function encryptNumber(value: number): Promise<{
  encrypted: Uint8Array;
  proof: Uint8Array;
}>
```

**Parameters**:
- `value`: Number to encrypt (0-4294967295 for euint32)

**Returns**:
- `encrypted`: FHE encrypted data
- `proof`: ZK proof for on-chain verification

**Example**:
```typescript
import { encryptNumber } from "@/lib/fhe";

const riskScore = 75;
const { encrypted, proof } = await encryptNumber(riskScore);

// Send to backend
const response = await fetch("/api/submit", {
  body: JSON.stringify({
    encryptedRiskScore: Buffer.from(encrypted).toString("hex"),
    proof: Buffer.from(proof).toString("hex")
  })
});
```

#### requestDecryption

Request decryption from KMS Gateway (authorized only).

```typescript
async function requestDecryption(params: {
  contractAddress: string;
  encryptedValue: string;
  signature: string;
}): Promise<number>
```

**Parameters**:
- `contractAddress`: MedicalDataRegistry address
- `encryptedValue`: FHE encrypted value
- `signature`: Doctor's authorization signature

**Returns**: Decrypted number

**Authorization**: Only works if `msg.sender` is authorized doctor on-chain.

**Example**:
```typescript
import { requestDecryption } from "@/lib/fhe";

const decrypted = await requestDecryption({
  contractAddress: process.env.MEDICAL_REGISTRY_ADDRESS,
  encryptedValue: "0xabcd...",
  signature: doctorSignature
});

console.log("Risk Score:", decrypted);
```

---

## Authentication

### Privy Integration

Located in `app/src/app/layout.tsx`.

#### Configuration

```typescript
<PrivyProvider
  appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
  config={{
    loginMethods: ["email", "google"],
    embeddedWallets: {
      createOnLogin: "all-users",
      showWalletLoginFirst: false
    }
  }}
>
```

**Login Methods**:
- Email (passwordless)
- Google OAuth
- Embedded wallets (automatic creation)

#### Usage in Components

```typescript
import { usePrivy } from "@privy-io/react-auth";

function MyComponent() {
  const { user, authenticated, login, logout } = usePrivy();

  if (!authenticated) {
    return <button onClick={login}>Sign In</button>;
  }

  return (
    <div>
      <p>Wallet: {user?.wallet?.address}</p>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}
```

### Multi-Chain Support

Located in `app/src/lib/wagmi.ts`.

```typescript
const wagmiConfig = createConfig({
  chains: [sepolia, ogMainnet],
  transports: {
    [sepolia.id]: http(),
    [ogMainnet.id]: http()
  }
});
```

**Switching Networks**:
```typescript
import { useChainId, useSwitchChain } from "wagmi";

function NetworkSwitcher() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  return (
    <button onClick={() => switchChain({ chainId: 11155111 })}>
      Switch to Sepolia
    </button>
  );
}
```

---

## Error Handling

All backend services use the Result pattern:

```typescript
type Result<T> =
  | { ok: T }
  | { error: string };
```

**Example Usage**:
```typescript
const result = await storage.uploadEncrypted({ data, key });

if ("ok" in result) {
  // Success
  console.log("Uploaded:", result.ok.merkleRoot);
} else {
  // Error
  console.error("Failed:", result.error);
}
```

---

## Rate Limits

- **0G Storage**: ~10 uploads/min (testnet)
- **0G Compute**: ~5 requests/min (testnet)
- **Sepolia RPC**: Varies by provider (public nodes: ~100 req/min)
- **KMS Gateway**: ~50 decryption requests/hour (testnet)

For production, use dedicated endpoints with higher limits.

---

## Security Considerations

1. **FHE Proofs**: Always verify proofs on-chain before processing
2. **Doctor Authorization**: Check `authorizedDoctors` mapping before decryption
3. **TEE Signatures**: Validate 0G Compute signatures to ensure genuine TEE execution
4. **AES Keys**: Never transmit raw encryption keys; derive from wallet signatures
5. **HTTPS Only**: All API communication must use HTTPS
6. **Input Validation**: Use Zod schemas for all API inputs
7. **Gas Limits**: Set explicit gas limits for FHE operations

---

## Testing

### Test Contract Deployment

```bash
cd packages/contracts
npx hardhat test
```

### Test 0G Storage

```bash
cd packages/backend
npm run test:storage
```

### Test API Routes

```bash
cd app
npm run test
```

### Test End-to-End Flow

```bash
npm run test:e2e
```

---

## Support

For API issues:
- Contract: Check Sepolia Etherscan for transaction details
- 0G Storage: Monitor at https://indexer-storage-testnet-standard.0g.ai
- 0G Compute: Check TEE signatures for validation errors
- FHE: Verify KMS Gateway connection and authorization

