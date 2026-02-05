#!/bin/bash

# Development script for HTML to PNG converter

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}HTML to PNG Converter - Development Setup${NC}"
echo "============================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}Error: Node.js 20+ is required (found: $(node -v))${NC}"
    exit 1
fi

echo -e "${GREEN}Node.js version: $(node -v)${NC}"

# Navigate to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
    # Generate a random JWT secret
    JWT_SECRET=$(openssl rand -hex 32)
    sed -i.bak "s/your-super-secret-jwt-key-change-in-production/$JWT_SECRET/" .env
    rm -f .env.bak
    echo -e "${GREEN}.env created with random JWT secret${NC}"
fi

# Create data directory
mkdir -p data

# Install dependencies
echo -e "${YELLOW}Installing server dependencies...${NC}"
cd server
npm install

# Install Playwright browsers if not already installed
echo -e "${YELLOW}Checking Playwright browsers...${NC}"
npx playwright install chromium --with-deps 2>/dev/null || npx playwright install chromium

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "To start the development server, run:"
echo -e "  ${YELLOW}cd server && npm run dev${NC}"
echo ""
echo "The server will be available at:"
echo -e "  ${GREEN}http://localhost:3000${NC}"
