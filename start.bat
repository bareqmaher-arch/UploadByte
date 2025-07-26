@echo off
chcp 65001 >nul
cls

echo "Starting File Manager Pro..."

if not exist .env (
    echo "Creating .env file..."
    (
        echo PORT=3001
        echo NODE_ENV=production
        echo BASE_URL=http://localhost:3001
        echo SESSION_SECRET=your-super-secure-secret-key-change-this-in-production-2024
        echo.
        echo # Gmail Configuration for Email Verification
        echo # Follow GMAIL_SETUP.md to configure these
        echo EMAIL_USER=your-gmail@gmail.com
        echo EMAIL_PASS=your-16-character-app-password
        echo.
        echo # File Upload Settings
        echo MAX_FILE_SIZE=107374182400
        echo MAX_FILES_PER_UPLOAD=10
        echo UPLOAD_PATH=./uploads
        echo.
        echo # Security Settings
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=20
        echo AUTH_RATE_LIMIT_MAX=5
        echo.
        echo # Database Paths
        echo DB_PATH=./files.db
        echo SESSIONS_DB_PATH=./sessions.db
        echo.
        echo # Share Link Settings
        echo SHARE_LINK_EXPIRY_DAYS=7
    ) > .env
    echo ".env file created"
)

node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo "Node.js found"
    node --version
) else (
    echo "Node.js not found. Please install Node.js 16+ first."
    echo "Download from: https://nodejs.org/"
    pause
    exit /b 1
)

npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo "npm found"
    npm --version
) else (
    echo "npm not found. Please install npm first."
    pause
    exit /b 1
)

echo.
echo "Installing dependencies..."
npm install
if %errorlevel% equ 0 (
    echo "Dependencies installed successfully"
) else (
    echo "Failed to install dependencies"
    pause
    exit /b 1
)

echo.
echo "Creating directories..."
if not exist uploads mkdir uploads
if not exist ssl mkdir ssl
if not exist public mkdir public
echo "Directories created"

echo.
echo "Checking email configuration..."
findstr "your-gmail@gmail.com" .env >nul
if %errorlevel% equ 0 (
    echo "Email not configured yet."
    echo.
    echo "Please follow these steps to enable email verification:"
    echo.
    echo "1. Read GMAIL_SETUP.md for detailed instructions"
    echo "2. Go to https://myaccount.google.com/security"
    echo "3. Enable 2-Factor Authentication"
    echo "4. Generate App Password for Mail"
    echo "5. Update EMAIL_USER and EMAIL_PASS in .env"
    echo.
    echo "Your app will work in demo mode until email is configured."
) else (
    echo "Email configuration found"
)

echo.
echo "Checking authentication packages..."
npm list bcrypt >nul 2>&1
if %errorlevel% equ 0 (
    echo "All authentication packages installed"
) else (
    echo "Some authentication packages missing. Installing..."
    npm install bcrypt express-session connect-sqlite3 nodemailer
)

echo.
echo "File Manager Pro setup complete!"
echo.
echo "Access your File Manager Pro:"
echo "  Local:    http://localhost:3001"
echo.
echo "To start the server, run: npm start"
echo.
pause
