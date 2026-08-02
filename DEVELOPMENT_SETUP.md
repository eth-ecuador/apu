# APU Medical AI - Development Setup

Quick start guide for local development.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your values

# 3. Setup database
createdb apu
cd packages/backend && npx drizzle-kit push

# 4. Compile contracts
npm run contracts:compile

# 5. Start development server
npm run dev
```

## Project Structure

```
apu/
├── packages/
│   ├── contracts/          # Solidity contracts (Hardhat)
│   │   ├── contracts/
│   │   │   └── MedicalDataRegistry.sol
│   │   ├── scripts/
│   │   │   └── deploy.ts
│   │   ├── hardhat.config.ts
│   │   └── package.json
│   │
│   └── backend/            # Backend services (Node.js)
│       ├── src/
│       │   ├── services/
│       │   │   ├── og-storage.service.ts
│       │   │   ├── og-compute.service.ts
│       │   │   └── dual-network-provider.service.ts
│       │   ├── db/
│       │   │   └── schema.ts
│       │   └── index.ts
│       └── package.json
│
├── app/                    # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── patient/page.tsx    # Patient portal
│   │   │   ├── doctor/page.tsx     # Doctor portal
│   │   │   └── api/
│   │   │       ├── submit/route.ts
│   │   │       ├── patients/route.ts
│   │   │       └── diagnose/route.ts
│   │   ├── components/
│   │   │   ├── PatientDashboard.tsx
│   │   │   └── NetworkStatus.tsx
│   │   └── lib/
│   │       ├── fhe.ts              # FHE encryption helpers
│   │       └── wagmi.ts            # Multi-chain config
│   └── package.json
│
├── .env.example
├── package.json            # Root package.json (workspace)
└── README.md
```

## Technology Stack

### Frontend (`app/`)
- **Framework**: Next.js 16.2.11 (App Router)
- **Authentication**: Privy 3.35.2 (email + embedded wallets)
- **Blockchain**: wagmi 2.19.0 + viem 2.55.0
- **FHE**: @zama-fhe/react-sdk 3.3.0
- **Styling**: Tailwind CSS 4
- **TypeScript**: 5.7.0

### Backend (`packages/backend/`)
- **Runtime**: Node.js 20+
- **Blockchain**: ethers.js 6.17.0
- **0G Storage**: @0gfoundation/0g-storage-ts-sdk 1.2.10
- **0G Compute**: @0gfoundation/0g-compute-ts-sdk 0.9.0
- **Database**: Drizzle ORM 0.45.2 + PostgreSQL
- **Validation**: zod 4.4.3

### Smart Contracts (`packages/contracts/`)
- **Solidity**: 0.8.27
- **FHE**: @fhevm/solidity 0.11.1
- **Dev Tools**: Hardhat 2.24.0
- **Networks**: Sepolia (11155111) + 0G Mainnet (16661)

## Development Workflows

### 1. Contract Development

```bash
cd packages/contracts

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to local network
npx hardhat node                    # Terminal 1
npm run deploy:localhost            # Terminal 2

# Deploy to Sepolia
npm run deploy:sepolia

# Verify on Etherscan
npm run verify:sepolia
```

### 2. Backend Development

```bash
cd packages/backend

# Start development server
npm run dev

# Test 0G Storage integration
npm run test:storage

# Test 0G Compute integration
npm run test:compute

# Run database migrations
npx drizzle-kit push

# Generate Drizzle types
npx drizzle-kit generate
```

### 3. Frontend Development

```bash
cd app

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

## Key Files to Edit

### Adding a New Contract Function

1. Edit `packages/contracts/contracts/MedicalDataRegistry.sol`
2. Add function with FHE types:

```solidity
function updateDiagnosis(
    address patient,
    externalEuint32 calldata newDiagnosis,
    bytes calldata proof
) external onlyAuthorizedDoctor {
    FHE.permissionCheck(proof);
    patients[patient].encryptedDiagnosis = FHE.asEuint32(newDiagnosis);
    emit DiagnosisUpdated(patient);
}
```

3. Compile: `npm run compile`
4. Update ABI in backend and frontend

### Adding a New Backend Service

1. Create `packages/backend/src/services/my-service.service.ts`
2. Use Result pattern for error handling:

```typescript
export class MyService {
  async doSomething(): Promise<
    { ok: MyResult } | { error: string }
  > {
    try {
      // Implementation
      return { ok: result };
    } catch (error) {
      return { error: error.message };
    }
  }
}
```

3. Import in `DualNetworkProvider`

### Adding a New API Route

1. Create `app/src/app/api/my-route/route.ts`
2. Use Zod for validation:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const MySchema = z.object({
  field: z.string()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = MySchema.parse(body);

    // Handle request

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
```

### Adding a New Frontend Component

1. Create `app/src/components/MyComponent.tsx`
2. Use Privy hooks for auth:

```typescript
"use client";

import { usePrivy } from "@privy-io/react-auth";

export function MyComponent() {
  const { user, authenticated } = usePrivy();

  if (!authenticated) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome {user?.email?.address}</div>;
}
```

3. Import in page component

## Environment Variables Reference

### Required

```bash
# Deployment
DEPLOYER_PRIVATE_KEY=              # Sepolia deployment key
OG_DEPLOYER_PRIVATE_KEY=           # 0G deployment key

# RPC URLs
SEPOLIA_RPC_URL=                   # Sepolia RPC endpoint
OG_RPC_URL=                        # 0G mainnet RPC

# Contracts
MEDICAL_REGISTRY_ADDRESS=          # Deployed contract address

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=          # Privy app ID
NEXT_PUBLIC_KMS_GATEWAY_URL=       # Zama KMS Gateway

# Database
DATABASE_URL=                      # PostgreSQL connection string
```

### Optional

```bash
# 0G Services
OG_STORAGE_NODE_URL=               # 0G Storage RPC
OG_INDEXER_URL=                    # 0G Indexer URL

# Development
REPORT_GAS=true                    # Gas reporting in tests
ETHERSCAN_API_KEY=                 # Contract verification
```

## Common Tasks

### Reset Local Database

```bash
dropdb apu && createdb apu
cd packages/backend && npx drizzle-kit push
```

### Clear Frontend Build Cache

```bash
cd app
rm -rf .next
npm run build
```

### Update All Dependencies

```bash
npm update --workspaces
```

### Run Full Test Suite

```bash
# Contracts
cd packages/contracts && npm run test

# Backend
cd packages/backend && npm run test

# Frontend
cd app && npm run test
```

## Debugging

### Enable Hardhat Console Logs

In `MedicalDataRegistry.sol`:

```solidity
import "hardhat/console.sol";

function submitPatientData(...) {
    console.log("Patient:", patient);
    console.log("Risk score submitted");
}
```

### Enable Next.js Debug Mode

```bash
NODE_OPTIONS='--inspect' npm run dev
```

Open `chrome://inspect` in Chrome.

### View Contract Events

```bash
cd packages/contracts
npx hardhat run scripts/watch-events.ts --network sepolia
```

### Monitor 0G Storage Uploads

```bash
cd packages/backend
npm run watch:storage
```

## Performance Tips

### Optimize Contract Gas Usage

- Use `euint32` instead of `euint64` when possible
- Batch operations in single transaction
- Use `calldata` instead of `memory` for external functions

### Optimize Frontend Bundle

- Use dynamic imports for heavy components
- Lazy load 0G SDK only when needed
- Enable Next.js SWC minification

### Optimize Database Queries

- Add indexes on frequently queried columns
- Use `select` to limit returned fields
- Implement pagination for large datasets

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes, commit frequently
git add .
git commit -m "feat: add my feature"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub
```

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run contracts:compile
      - run: npm run contracts:test
      - run: npm run build
```

## VSCode Extensions

Recommended extensions:

- Solidity (Juan Blanco)
- Hardhat Solidity (NomicFoundation)
- Tailwind CSS IntelliSense
- Prisma (for Drizzle schema)
- ESLint
- Prettier

## Resources

- [Zama FHE Docs](https://docs.zama.ai)
- [0G Network Docs](https://docs.0g.ai)
- [Hardhat Docs](https://hardhat.org/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Privy Docs](https://docs.privy.io)
- [wagmi Docs](https://wagmi.sh)
