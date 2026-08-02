#!/bin/bash

# APU Medical AI - Initial Setup Script
# This script automates the initial setup for local development

set -e

echo "🏥 APU Medical AI - Setup Script"
echo "================================"
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20+ is required (current: v$NODE_VERSION)"
    exit 1
fi
echo "✅ Node.js version OK"

# Check npm
echo "Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✅ npm OK"

# Check PostgreSQL
echo "Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. You'll need to install it manually."
else
    echo "✅ PostgreSQL OK"
fi

echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file - please edit it with your values"
else
    echo "⚠️  .env already exists, skipping"
fi

echo ""
echo "Creating database (if needed)..."
read -p "Create PostgreSQL database 'apu'? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    createdb apu 2>/dev/null && echo "✅ Database created" || echo "⚠️  Database might already exist"
fi

echo ""
echo "Running database migrations..."
cd packages/backend
npx drizzle-kit push --config=drizzle.config.ts
cd ../..

echo ""
echo "Compiling smart contracts..."
npm run contracts:compile

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your private keys and API keys"
echo "2. Deploy contracts: npm run contracts:deploy:sepolia"
echo "3. Update .env with deployed contract address"
echo "4. Start development: npm run dev"
echo ""
echo "For detailed instructions, see:"
echo "- DEPLOYMENT_GUIDE.md"
echo "- DEVELOPMENT_SETUP.md"
