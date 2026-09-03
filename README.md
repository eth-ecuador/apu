# APU - Privacy-Preserving Medical AI

AI-powered medical diagnosis system with complete privacy using Fully Homomorphic Encryption (FHE) and decentralized AI.

**🏆 Features ERC-7857 (Agentic ID)**: Tokenize AI agents as NFTs with encrypted metadata

## Architecture

### Dual-Network Design

- **Ethereum Sepolia**: FHE encrypted medical data (Zama fhEVM)
- **0G Network**: Decentralized storage and TEE-verified AI inference

### Technology Stack

- **Smart Contracts**: Solidity 0.8.27 with Zama FHE + **ERC-7857 (Agentic ID)**
- **Backend**: Node.js with Drizzle ORM
- **Frontend**: Next.js 16 with Privy authentication
- **Storage**: 0G Storage with AES-256-GCM encryption
- **AI**: 0G Compute with TEE attestation

### ERC-7857 Implementation

APU implements the official **Agentic ID** standard (ERC-7857) for tokenizing AI agents:

- **📄 Contracts**: `APUAgenticID.sol`, `IERC7857.sol`
- **🔑 Features**: NFT-based AI ownership, encrypted metadata, TEE-verified transfers
- **📊 Documentation**: See `ERC7857_IMPLEMENTATION.md` for complete technical details
- **🎯 Use Case**: Medical AI agents as tradeable, privacy-preserving NFTs

Only **3-4 of 21 projects** in 0G Bridge by AKINDO Wave 3 have implemented this standard.

## Getting Started

### Prerequisites

- Node.js >= 20
- PostgreSQL
- Private keys for deployment

### Installation

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Setup database
npm run db:push --workspace=packages/backend
```

### Development

```bash
# Start frontend
npm run dev

# Compile contracts
npm run contracts:compile

# Run backend
npm run backend:dev
```

### Deployment

```bash
# Deploy to Sepolia
npm run contracts:deploy:sepolia

# Setup 0G integration
npm run contracts:deploy:og
```

## Project Structure

```
apu/
├── packages/
│   ├── contracts/          # Hardhat smart contracts
│   │   ├── contracts/      # Solidity contracts
│   │   └── scripts/        # Deployment scripts
│   └── backend/            # Backend services
│       ├── src/
│       │   ├── db/         # Drizzle ORM schema
│       │   └── services/   # 0G integration
│       └── drizzle.config.ts
└── app/                    # Next.js frontend
    └── src/
        ├── app/            # App router pages
        ├── components/     # React components
        └── lib/            # Utilities
```

## Key Features

- **Privacy-First**: FHE ensures data never decrypted on-chain
- **Decentralized AI**: 0G Compute with TEE attestation
- **Cross-Chain**: Dual-network architecture
- **User-Friendly**: Email login with embedded wallets (Privy)
- **Production-Ready**: Gas sponsorship, monitoring, compliance

## Live Deployments

### Production Environments

- **Frontend**: https://apu-frontend.onrender.com
- **Backend API**: https://apu-backend-7a8z.onrender.com

### Smart Contracts (Sepolia)

- **MedicalDataRegistry**: `0x2819Cf40a952748014C56f393e1ffd16f4a377ff`
  - [Etherscan](https://sepolia.etherscan.io/address/0x2819Cf40a952748014C56f393e1ffd16f4a377ff)

- **APUAgenticID (ERC-7857)**: `0xE619B84c5837E43512cA219f0bffa6c9A290Ba99`
  - [Etherscan](https://sepolia.etherscan.io/address/0xE619B84c5837E43512cA219f0bffa6c9A290Ba99)

### 0G Network Integration

- **Storage**: 0G Storage Testnet (Galileo)
- **Compute**: 0G Compute TEE with ECDSA verification
- **Network**: https://evmrpc-testnet.0g.ai

## Quick Start

Run the automated setup script:

```bash
./setup.sh
```

Or manually:

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your values

# 3. Create database
createdb apu
npm run db:push --workspace=packages/backend

# 4. Compile contracts
npm run contracts:compile

# 5. Start development server
npm run dev
```

## Testing

```bash
# Test 0G Storage integration
npm run test:storage --workspace=packages/backend

# Test 0G Compute integration
npm run test:compute --workspace=packages/backend

# Test contracts
npm run test --workspace=packages/contracts

# Test frontend
npm run test --workspace=app
```

## Security

- All patient data encrypted with FHE (Zama)
- Medical history encrypted with AES-256-GCM
- AI diagnosis runs in TEE (Trusted Execution Environment)
- Doctor authorization enforced on-chain
- KMS Gateway for decryption control

## Contributing

Contributions welcome! Please read the development guide first.

## License

MIT
