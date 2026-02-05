#!/bin/bash

# HTML2PNG Update Script
# This script updates HTML2PNG to the latest version

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║              HTML2PNG Update Script                       ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not a git repository. Please run this script from the html2png directory.${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${CYAN}Checking for updates...${NC}"
echo ""

# Fetch latest changes
git fetch origin main

# Check if there are updates
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo -e "${GREEN}✓ Already up to date!${NC}"
    echo ""
    read -p "Do you want to rebuild anyway? (y/N): " rebuild
    if [[ ! "$rebuild" =~ ^[Yy]$ ]]; then
        echo -e "${CYAN}No changes made.${NC}"
        exit 0
    fi
else
    # Show what's new
    echo -e "${YELLOW}New updates available:${NC}"
    echo ""
    git log --oneline HEAD..origin/main | head -10
    echo ""

    read -p "Do you want to update? (Y/n): " confirm
    if [[ "$confirm" =~ ^[Nn]$ ]]; then
        echo -e "${CYAN}Update cancelled.${NC}"
        exit 0
    fi

    # Pull latest changes
    echo ""
    echo -e "${CYAN}Pulling latest changes...${NC}"
    git pull origin main
fi

echo ""
echo -e "${CYAN}Rebuilding Docker container...${NC}"
echo ""

cd docker

# Stop existing container
if docker ps -q -f name=html2png | grep -q .; then
    echo -e "${YELLOW}Stopping existing container...${NC}"
    docker stop html2png
fi

# Remove old container
if docker ps -aq -f name=html2png | grep -q .; then
    echo -e "${YELLOW}Removing old container...${NC}"
    docker rm html2png
fi

# Rebuild and start
if docker compose version &> /dev/null; then
    docker compose up -d --build
else
    docker-compose up -d --build
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║            HTML2PNG updated successfully!                 ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Show current version
echo -e "   ${CYAN}Current version:${NC}"
echo "   $(git log -1 --format='%h - %s (%cr)')"
echo ""
echo -e "   ${CYAN}Service status:${NC}"
docker ps --filter name=html2png --format "   Container: {{.Names}}\n   Status: {{.Status}}\n   Ports: {{.Ports}}"
echo ""
