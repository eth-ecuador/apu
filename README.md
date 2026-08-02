# APU - Privacy-Preserving Medical AI

AI-powered medical diagnosis system with complete privacy using Fully Homomorphic Encryption (FHE) and decentralized AI.

## Architecture

### Dual-Network Design

- **Ethereum Sepolia**: FHE encrypted medical data (Zama fhEVM)
- **0G Network**: Decentralized storage and TEE-verified AI inference

### Technology Stack

- **Smart Contracts**: Solidity 0.8.27 with Zama FHE
- **Backend**: Node.js with Drizzle ORM
- **Frontend**: Next.js 16 with Privy authentication
- **Storage**: 0G Storage with AES-256-GCM encryption
- **AI**: 0G Compute with TEE attestation

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

## Documentation

- [Technical Architecture](./APU_0G_ZAMA_PRODUCTION_ARCHITECTURE.md)
- [Compatibility Review](./COMPATIBILITY_REVIEW_FINAL.md)
- [0G Implementation Guide](./0G_TECHNICAL_IMPLEMENTATION_GUIDE.md)

## License

MIT
