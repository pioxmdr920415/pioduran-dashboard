#!/bin/bash

# Install and Build Script for MDRRMO Pio Duran Dashboard
# Run this script from the pioduran-dashboard root folder
# Usage: bash install-and-build.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     MDRRMO Dashboard - Install & Build Script             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found!${NC}"
    echo "Please run this script from the pioduran-dashboard root folder"
    exit 1
fi

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Track if any step failed
FAILED=0

# Step 1: Install Frontend Dependencies
print_section "Step 1: Installing Frontend Dependencies"
if [ -d "frontend" ]; then
    cd frontend
    
    if [ -f "package.json" ]; then
        echo "Running: yarn install"
        if yarn install; then
            print_success "Frontend dependencies installed"
        else
            print_error "Failed to install frontend dependencies"
            FAILED=1
        fi
    else
        print_error "frontend/package.json not found"
        FAILED=1
    fi
    
    cd ..
else
    print_error "frontend directory not found"
    FAILED=1
fi

# Step 2: Install Backend Dependencies
print_section "Step 2: Installing Backend Dependencies"
if [ -d "backend" ]; then
    cd backend
    
    if [ -f "requirements.txt" ]; then
        echo "Running: pip install -r requirements.txt"
        if pip install -r requirements.txt --quiet; then
            print_success "Backend dependencies installed"
        else
            print_error "Failed to install backend dependencies"
            FAILED=1
        fi
    else
        print_error "backend/requirements.txt not found"
        FAILED=1
    fi
    
    cd ..
else
    print_error "backend directory not found"
    FAILED=1
fi

# Step 3: Build Frontend
print_section "Step 3: Building Frontend Application"
if [ -d "frontend" ]; then
    cd frontend
    
    echo "Running: yarn build"
    echo "(This may take a minute...)"
    if yarn build; then
        print_success "Frontend build completed"
        
        # Show build statistics
        if [ -d "build" ]; then
            build_size=$(du -sh build | cut -f1)
            echo "Build size: $build_size"
        fi
    else
        print_error "Frontend build failed"
        FAILED=1
    fi
    
    cd ..
else
    print_error "frontend directory not found"
    FAILED=1
fi

# Summary
echo ""
print_section "Summary"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tasks completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo ""
    echo "  1. Start Frontend:"
    echo "     cd frontend && yarn start"
    echo "     → http://localhost:3000"
    echo ""
    echo "  2. Start Backend (in another terminal):"
    echo "     cd backend && uvicorn server:app --reload"
    echo "     → http://localhost:8001"
    echo ""
    echo -e "${BLUE}Production Build:${NC}"
    echo "  Frontend is ready at: frontend/build/"
    echo "  Serve with: npx serve -s frontend/build"
    echo ""
else
    echo -e "${RED}❌ Some tasks failed. Please check the errors above.${NC}"
    exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
