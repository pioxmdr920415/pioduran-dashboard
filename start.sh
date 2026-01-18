#!/bin/bash

# Start MDRRMO Dashboard - Full Stack Application
# This script starts both frontend and backend services

set -e

echo "🚀 MDRRMO Pio Duran Dashboard Startup"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if MongoDB is running (optional - for development)
check_mongo() {
    if command -v mongod &> /dev/null; then
        echo -e "${BLUE}ℹ️  MongoDB found, starting in background...${NC}"
        mongod --dbpath ./data/db &
        MONGO_PID=$!
        sleep 2
    fi
}

# Start Backend
start_backend() {
    echo -e "${BLUE}📦 Starting Backend Server...${NC}"
    cd /workspaces/pioduran-dashboard/backend
    
    # Check if port 8001 is free
    if lsof -Pi :8001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "⚠️  Port 8001 already in use. Skipping backend start."
    else
        uvicorn server:app --host 0.0.0.0 --port 8001 --reload &
        BACKEND_PID=$!
        echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
        echo "  API: http://localhost:8001"
        echo "  Docs: http://localhost:8001/docs"
    fi
}

# Start Frontend
start_frontend() {
    echo -e "${BLUE}🎨 Starting Frontend Server...${NC}"
    cd /workspaces/pioduran-dashboard/frontend
    
    # Check if port 3000 is free
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "⚠️  Port 3000 already in use. Skipping frontend start."
    else
        yarn start &
        FRONTEND_PID=$!
        echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
        echo "  App: http://localhost:3000"
    fi
}

# Main flow
echo -e "${BLUE}Checking services...${NC}"
echo ""

check_mongo
echo ""

start_backend
echo ""

start_frontend
echo ""

echo -e "${GREEN}✅ Services started!${NC}"
echo ""
echo "📍 Access the application at: http://localhost:3000"
echo ""
echo "To stop services:"
echo "  Press Ctrl+C to stop the frontend"
echo "  Kill backend: kill $BACKEND_PID"
echo ""
echo "Commands:"
echo "  Logs Backend: tail -f /var/log/supervisor/backend.out.log"
echo "  Logs Frontend: tail -f /var/log/supervisor/frontend.out.log"
echo "  Health Check: curl http://localhost:8001/api/health"
echo ""

# Wait for all processes
wait
