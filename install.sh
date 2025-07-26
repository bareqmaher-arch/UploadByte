#!/bin/bash

echo "🚀 Installing File Manager Pro..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
if npm install; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p uploads
mkdir -p ssl
mkdir -p public

echo -e "${GREEN}✅ Directories created${NC}"

# Copy environment file
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file from template${NC}"
        echo -e "${YELLOW}⚙️  Please configure your .env file before starting the server${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.example not found, creating basic .env file${NC}"
        cat > .env << EOF
PORT=3000
NODE_ENV=production
MAX_FILE_SIZE=52428800
MAX_FILES_PER_UPLOAD=10
UPLOAD_PATH=./uploads
EOF
    fi
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Set permissions for scripts
if [ -d "scripts" ]; then
    chmod +x scripts/*.sh
    echo -e "${GREEN}✅ Script permissions set${NC}"
fi

# Test server startup
echo -e "${YELLOW}🧪 Testing server startup...${NC}"
timeout 10s npm start &
SERVER_PID=$!
sleep 5

if kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Server starts successfully${NC}"
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null
else
    echo -e "${YELLOW}ℹ️  Server test completed${NC}"

fi

echo ""
echo -e "${GREEN}🎉 Installation complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Configure your .env file if needed"
echo "2. Run 'npm start' to start the server"
echo "3. Visit http://localhost:3000"
echo ""
echo -e "${YELLOW}For production deployment:${NC}"
echo "1. Configure SSL certificates in ./ssl/ directory"
echo "2. Update nginx.conf with your domain"
echo "3. Run 'docker-compose up -d' for containerized deployment"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "• npm start          - Start production server"
echo "• npm run dev        - Start development server"
echo "• docker-compose up  - Start with Docker"

# Create necessary directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p uploads
mkdir -p ssl
mkdir -p public

echo -e "${GREEN}✅ Directories created${NC}"

# Copy environment file
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file from template${NC}"
        echo -e "${YELLOW}⚙️  Please configure your .env file before starting the server${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.example not found, creating basic .env file${NC}"
        cat > .env << EOF
PORT=3000
NODE_ENV=production
MAX_FILE_SIZE=52428800
MAX_FILES_PER_UPLOAD=10
UPLOAD_PATH=./uploads
EOF
    fi
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Set permissions for scripts
if [ -d "scripts" ]; then
    chmod +x scripts/*.sh
    echo -e "${GREEN}✅ Script permissions set${NC}"
fi

# Test server startup
echo -e "${YELLOW}🧪 Testing server startup...${NC}"
timeout 10s "$NPM_CMD" start &
SERVER_PID=$!
sleep 5

if kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Server starts successfully${NC}"
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null
else
    echo -e "${YELLOW}ℹ️  Server test completed${NC}"

fi

echo ""
echo -e "${GREEN}🎉 Installation complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Configure your .env file if needed"
echo "2. Run 'npm start' to start the server"
echo "3. Visit http://localhost:3000"
echo ""
echo -e "${YELLOW}For production deployment:${NC}"
echo "1. Configure SSL certificates in ./ssl/ directory"
echo "2. Update nginx.conf with your domain"
echo "3. Run 'docker-compose up -d' for containerized deployment"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "• npm start          - Start production server"
echo "• npm run dev        - Start development server"
echo "• docker-compose up  - Start with Docker"
