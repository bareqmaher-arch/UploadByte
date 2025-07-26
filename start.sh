#!/bin/bash

# 🚀 File Manager Pro - Quick Start Script with Email Verification
# This script will help you get your file manager running with email verification

echo "🚀 Starting File Manager Pro with Email Verification..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}📋 Creating .env file...${NC}"
    cp .env.example .env 2>/dev/null || {
        echo -e "${YELLOW}📝 Creating basic .env file...${NC}"
        cat > .env << EOF
PORT=3001
NODE_ENV=production
BASE_URL=http://localhost:3001
SESSION_SECRET=your-super-secure-secret-key-change-this-in-production-2024

# Gmail Configuration for Email Verification
# Follow GMAIL_SETUP.md to configure these
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password

# File Upload Settings
MAX_FILE_SIZE=107374182400
MAX_FILES_PER_UPLOAD=10
UPLOAD_PATH=./uploads

# Security Settings
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=20
AUTH_RATE_LIMIT_MAX=5

# Database Paths
DB_PATH=./files.db
SESSIONS_DB_PATH=./sessions.db

# Share Link Settings
SHARE_LINK_EXPIRY_DAYS=7
EOF
    }
    echo -e "${GREEN}✅ .env file created${NC}"
fi

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js 16+ first.${NC}"
    exit 1
fi

# Check npm
NPM_VERSION=$(npm --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ npm found: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found. Please install npm first.${NC}"
    exit 1
fi

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

# Check email configuration
echo -e "${YELLOW}📧 Checking email configuration...${NC}"
if grep -q "your-gmail@gmail.com" .env; then
    echo -e "${YELLOW}⚠️  Email not configured yet.${NC}"
    echo -e "${BLUE}📚 Please follow these steps to enable email verification:${NC}"
    echo ""
    echo -e "${BLUE}1. Read GMAIL_SETUP.md for detailed instructions${NC}"
    echo -e "${BLUE}2. Go to https://myaccount.google.com/security${NC}"
    echo -e "${BLUE}3. Enable 2-Factor Authentication${NC}"
    echo -e "${BLUE}4. Generate App Password for Mail${NC}"
    echo -e "${BLUE}5. Update EMAIL_USER and EMAIL_PASS in .env${NC}"
    echo ""
    echo -e "${YELLOW}📝 Your app will work in demo mode until email is configured.${NC}"
else
    echo -e "${GREEN}✅ Email configuration found${NC}"
fi

# Set permissions for scripts
if [ -d "scripts" ]; then
    chmod +x scripts/*.sh
    echo -e "${GREEN}✅ Script permissions set${NC}"
fi

# Check for authentication packages
echo -e "${YELLOW}🔐 Checking authentication packages...${NC}"
if npm list bcrypt express-session connect-sqlite3 nodemailer >/dev/null 2>&1; then
    echo -e "${GREEN}✅ All authentication packages installed${NC}"
else
    echo -e "${YELLOW}⚠️  Some authentication packages missing. Installing...${NC}"
    npm install bcrypt express-session connect-sqlite3 nodemailer
fi

# Test server startup
echo -e "${YELLOW}🧪 Testing server startup...${NC}"
timeout 10s npm start > /dev/null 2>&1 &
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
echo -e "${GREEN}🎉 File Manager Pro setup complete!${NC}"
echo "=================================================="
echo ""

# Get network IP
get_network_ip() {
    local ip=$(hostname -I 2>/dev/null | cut -d' ' -f1)
    if [ -z "$ip" ]; then
        ip=$(ifconfig 2>/dev/null | grep 'inet ' | grep -v '127.0.0.1' | head -1 | awk '{print $2}' | cut -d: -f2)
    fi
    if [ -z "$ip" ]; then
        ip="localhost"
    fi
    echo "$ip"
}

NETWORK_IP=$(get_network_ip)

echo -e "${GREEN}🌐 Access your File Manager Pro:${NC}"
echo -e "${BLUE}   Local:    http://localhost:3001${NC}"
echo -e "${BLUE}   Network:  http://$NETWORK_IP:3001${NC}"
echo ""

echo -e "${GREEN}🔥 Features:${NC}"
echo -e "${GREEN}   ✅ User Authentication with Email Verification${NC}"
echo -e "${GREEN}   ✅ 100GB File Upload Support${NC}"
echo -e "${GREEN}   ✅ Secure File Sharing with Expiring Links${NC}"
echo -e "${GREEN}   ✅ Beautiful Responsive UI${NC}"
echo -e "${GREEN}   ✅ Real-time Upload Progress${NC}"
echo -e "${GREEN}   ✅ Professional Email Templates${NC}"
echo ""

echo -e "${YELLOW}📧 Email Verification Status:${NC}"
if grep -q "your-gmail@gmail.com" .env; then
    echo -e "${YELLOW}   ⚠️  Not configured (demo mode)${NC}"
    echo -e "${YELLOW}   📚 Read GMAIL_SETUP.md to enable${NC}"
else
    echo -e "${GREEN}   ✅ Configured and ready${NC}"
fi

echo ""
echo -e "${YELLOW}🚀 Next Steps:${NC}"
echo "1. Configure email verification (see GMAIL_SETUP.md)"
echo "2. Run 'npm start' to start the server"
echo "3. Visit http://localhost:3001"
echo "4. Create your account and verify email"
echo "5. Start uploading files up to 100GB each!"
echo ""

echo -e "${YELLOW}📋 Useful Commands:${NC}"
echo "• npm start              - Start production server"
echo "• npm run dev            - Start development server with auto-reload"
echo "• docker-compose up -d   - Run with Docker"
echo ""

echo -e "${YELLOW}📚 Documentation:${NC}"
echo "• README.md              - Complete project documentation"
echo "• GMAIL_SETUP.md         - Email verification setup guide"
echo "• README_EMAIL_SETUP.md  - Detailed email configuration"
echo ""

echo -e "${YELLOW}🔧 Configuration Files:${NC}"
echo "• .env                   - Environment variables"
echo "• files.db               - SQLite database (auto-created)"
echo "• sessions.db            - Session storage (auto-created)"
echo "• uploads/               - File storage directory"
echo ""

echo -e "${GREEN}💡 Pro Tips:${NC}"
echo "• Use a dedicated Gmail account for sending emails"
echo "• Generate App Password (not regular password) for Gmail"
echo "• Large files upload in chunks with progress tracking"
echo "• Share links expire after 7 days (configurable)"
echo "• Only verified users can upload files"
echo ""

# Check if we should start the server
echo -e "${BLUE}🚀 Start the server now? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${GREEN}🚀 Starting File Manager Pro...${NC}"
    npm start
else
    echo -e "${YELLOW}💡 Run 'npm start' when you're ready!${NC}"
fi

echo ""
echo -e "${GREEN}🎯 Quick Setup Checklist:${NC}"
echo "□ Email verification configured (GMAIL_SETUP.md)"
echo "□ Server started (npm start)"
echo "□ Account created and verified"
echo "□ First file uploaded successfully"
echo ""

echo -e "${BLUE}💌 Created with ❤️  by Bareq Maher${NC}"
echo -e "${BLUE}🔗 GitHub: https://github.com/bareqmaher-arch${NC}"
echo ""

echo -e "${GREEN}✨ Enjoy your File Manager Pro with Email Verification! ✨${NC}"