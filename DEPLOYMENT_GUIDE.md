# APU Medical AI - Deployment Guide

Complete guide for deploying the dual-network medical AI system across Sepolia (Zama FHE) and 0G Network (Storage + Compute).

## Prerequisites

### Required Software
- Node.js 20+
- npm 10+
- PostgreSQL 16+
- Git

### Required Accounts
1. **Sepolia Testnet**
   - Wallet with ETH (get from faucet: https://sepoliafaucet.com)
   - Private key for deployment

2. **0G Network**
   - Wallet with 0G tokens
   - Private key for deployment

3. **Privy Account**
   - Sign up at https://privy.io
   - Create new app, get App ID

4. **Etherscan API**
   - Sign up at https://etherscan.io
   - Generate API key for contract verification

## Installation

### 1. Clone and Install Dependencies

```bash
cd /path/to/apu
npm install
```

This installs all dependencies for the monorepo:
- `packages/contracts`: Hardhat, Zama FHE SDK
- `packages/backend`: 0G SDKs, ethers.js, Drizzle
- `app`: Next.js, Privy, wagmi, viem

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```bash
# Deployment Keys
DEPLOYER_PRIVATE_KEY=your_sepolia_private_key
OG_DEPLOYER_PRIVATE_KEY=your_0g_private_key

# RPC URLs (default values work)
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
OG_RPC_URL=https://evmrpc.0g.ai

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/apu

# Optional
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. Setup Database

```bash
# Create PostgreSQL database
createdb apu

# Run Drizzle migrations
cd packages/backend
npx drizzle-kit push
```

## Contract Deployment

### 1. Compile Contracts

```bash
npm run contracts:compile
```

This compiles `MedicalDataRegistry.sol` with:
- Solidity 0.8.27
- viaIR: true (required for FHE)
- Optimizer: 800 runs

### 2. Deploy to Sepolia

```bash
npm run contracts:deploy:sepolia
```

Expected output:
```
Deploying MedicalDataRegistry to Sepolia...
Contract deployed at: 0x1234...5678
Transaction hash: 0xabcd...efgh
```

**Save the contract address** - you'll need it for the next step.

### 3. Update Environment with Contract Address

Edit `.env`:

```bash
MEDICAL_REGISTRY_ADDRESS=0x1234...5678
```

### 4. Verify Contract on Etherscan (Optional)

```bash
npm run contracts:verify:sepolia
```

## 0G Network Setup

### 1. Configure 0G Storage

The backend service uses these 0G Storage endpoints:

```bash
OG_STORAGE_NODE_URL=https://rpc-storage-testnet.0g.ai
OG_INDEXER_URL=https://indexer-storage-testnet-standard.0g.ai
```

For production, replace with mainnet URLs:

```bash
OG_STORAGE_NODE_URL=https://rpc-storage-mainnet.0g.ai
OG_INDEXER_URL=https://indexer-storage-mainnet-standard.0g.ai
```

### 2. Test 0G Storage Connection

```bash
cd packages/backend
npm run test:storage
```

This uploads a test blob and verifies it can be retrieved.

### 3. Configure 0G Compute

Set up 0G Compute service URLs:

```bash
ZG_COMPUTE_PROVIDER_URL=your_compute_provider_url
ZG_COMPUTE_SERVICE_URL=your_compute_service_url
```

## Frontend Deployment

### 1. Build Next.js App

```bash
cd app
npm run build
```

### 2. Test Locally

```bash
npm run dev
```

Open http://localhost:3000

### 3. Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_PRIVY_APP_ID`
- `NEXT_PUBLIC_KMS_GATEWAY_URL`
- `NEXT_PUBLIC_SEPOLIA_RPC_URL`
- `DATABASE_URL`
- `MEDICAL_REGISTRY_ADDRESS`

## Authorization Setup

### 1. Authorize Doctors

Doctors must be authorized on-chain to decrypt patient data.

```bash
cd packages/contracts
npx hardhat run scripts/authorize-doctor.ts --network sepolia
```

Edit the script to include doctor addresses:

```typescript
const doctorAddresses = [
  "0xDoctor1...",
  "0xDoctor2..."
];
```

### 2. Configure KMS Gateway Access

Authorized doctors can request decryption from Zama's KMS Gateway:

```bash
NEXT_PUBLIC_KMS_GATEWAY_URL=https://gateway.sepolia.zama.dev
```

## Testing End-to-End Flow

### 1. Patient Submission

1. Navigate to `/patient`
2. Connect wallet via Privy
3. Fill in symptoms, medical history, risk score
4. Click "Submit Data"

Expected result:
- FHE encryption of risk score
- Upload to 0G Storage
- Transaction on Sepolia
- Success message with transaction hash

### 2. Doctor Diagnosis

1. Navigate to `/doctor`
2. Connect authorized doctor wallet
3. View patient queue
4. Click "Review" on a patient
5. Request decryption from KMS Gateway
6. View diagnosis result

Expected result:
- Decrypted patient data
- AI diagnosis from 0G Compute
- Confidence score
- TEE signature verification

## Network Status Monitoring

The app displays real-time network status:

- **Sepolia**: FHE encryption status
- **0G Network**: Storage and Compute status

Check `/patient` page sidebar for network indicators.

## Security Checklist

- [ ] Private keys stored securely (never commit to git)
- [ ] Environment variables set correctly
- [ ] Database credentials secured
- [ ] Privy app configured with correct domain
- [ ] Doctor authorization list reviewed
- [ ] KMS Gateway access configured
- [ ] 0G Storage encryption enabled
- [ ] TEE signature verification active

## Production Considerations

### 1. RPC Endpoints

For production, use dedicated RPC endpoints:

```bash
SEPOLIA_RPC_URL=https://your-alchemy-or-infura-url
OG_RPC_URL=https://your-0g-mainnet-rpc
```

### 2. Database

Use managed PostgreSQL:
- AWS RDS
- Supabase
- Neon

Update `DATABASE_URL` accordingly.

### 3. Monitoring

Set up monitoring for:
- Contract events (patient submissions, diagnoses)
- 0G Storage uploads
- 0G Compute requests
- API errors
- Gas usage

### 4. Scaling

For high volume:
- Use Redis for caching patient data
- Implement queue system for AI diagnoses
- Add load balancer for API routes
- Use CDN for frontend assets

## Troubleshooting

### Contract Deployment Fails

**Error**: `viaIR must be enabled`

**Solution**: Ensure hardhat.config.ts has:
```typescript
settings: {
  viaIR: true
}
```

### FHE Encryption Fails

**Error**: `FHE client not initialized`

**Solution**: Ensure KMS Gateway URL is correct:
```bash
NEXT_PUBLIC_KMS_GATEWAY_URL=https://gateway.sepolia.zama.dev
```

### 0G Storage Upload Fails

**Error**: `Storage node unreachable`

**Solution**: Check network URLs:
```bash
OG_STORAGE_NODE_URL=https://rpc-storage-testnet.0g.ai
```

### Database Connection Fails

**Error**: `Connection refused`

**Solution**: Verify PostgreSQL is running:
```bash
pg_isready -h localhost -p 5432
```

## Support

For issues:
- Zama FHE: https://docs.zama.ai
- 0G Network: https://docs.0g.ai
- Privy: https://docs.privy.io

## Next Steps

After deployment:

1. Test complete patient flow
2. Test doctor authorization
3. Verify all data encrypted correctly
4. Monitor gas costs
5. Set up alerts for errors
6. Configure backup system
7. Document API endpoints
8. Create user guides
