#!/bin/bash

# Quick Start Script for Cloudflare AI Workers Chat
# This script helps you get started quickly

echo "🚀 Cloudflare AI Workers Chat - Quick Start"
echo "==========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "wrangler.toml" ]; then
    echo "❌ Error: wrangler.toml not found. Please run this script from the project root."
    exit 1
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo "✅ Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    cd ..
    exit 1
fi

echo "✅ Frontend dependencies installed"
echo ""

# Setup frontend environment
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local for frontend..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local (configured for local development)"
else
    echo "ℹ️  .env.local already exists"
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next Steps:"
echo "=============="
echo ""
echo "1. Authenticate with Cloudflare:"
echo "   npx wrangler login"
echo ""
echo "2. Start the backend (Terminal 1):"
echo "   npm run dev"
echo ""
echo "3. Start the frontend (Terminal 2):"
echo "   cd frontend && npm run dev"
echo ""
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "📖 For more details, see SETUP.md"
echo ""
