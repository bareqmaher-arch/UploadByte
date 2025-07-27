# 🚀 File Manager Pro v2.0

A modern, production-ready file upload and management system with **user authentication** and **secure file sharing**. Built with Node.js, Express, and SQLite. Features a beautiful responsive UI with drag-and-drop functionality, real-time progress tracking, and comprehensive file management capabilities.
For Live demo visit : https://uploadbyte-production.up.railway.app/

## ✨ New Features in v2.0

### 🔐 **User Authentication System**
- **Secure Registration** - bcrypt password hashing with salt
- **Session Management** - Express sessions with SQLite store
- **Login Protection** - Rate limiting and secure cookies
- **User Isolation** - Each user can only access their own files
- **Password Security** - Minimum 6 characters with validation

### 🔗 **File Sharing System**
- **Secure Share Links** - Unique tokens for each shared file
- **Expiration Control** - Links expire after 7 days (configurable)
- **Public Downloads** - Share files with anyone via link
- **No Registration Required** - Recipients don't need accounts
- **Download Tracking** - Monitor how many times files are downloaded

### 🎨 **Enhanced UI/UX**
- **Modern Authentication Modal** - Smooth login/register experience
- **User Dashboard** - Personalized header with user info
- **Share Management** - Easy share link generation and copying
- **Visual Indicators** - Show which files are currently shared
- **Responsive Design** - Perfect on all devices

## 📂 **Project Structure**

```
file-manager-pro/
├── server.js                 # Main Express server with auth
├── package.json             # Dependencies including auth packages
├── .env                     # Environment configuration
├── public/                  # Frontend files
│   ├── index.html          # Enhanced UI with auth modal
│   ├── style.css           # Complete styling with auth components
│   ├── script.js           # Frontend with auth logic
│   └── sw.js               # Enhanced service worker
├── uploads/                 # User file storage
├── files.db                 # SQLite database with users table
├── sessions.db             # Session storage
└── README.md               # This comprehensive guide
```

## 🚀 **Quick Installation**

### **Prerequisites**
- Node.js 16+ and npm 8+
- 2GB RAM minimum
- 10GB+ storage space

### **Method 1: Quick Setup**

```bash
# 1. Create project directory
mkdir file-manager-pro && cd file-manager-pro

# 2. Copy all the enhanced files from the artifacts above
# (server.js, package.json, public/*, etc.)

# 3. Install dependencies
npm install

# 4. Create required directories
mkdir -p uploads public

# 5. Start the server
npm start

# 6. Open browser and create your account
open http://localhost:3000
```

### **Method 2: Development Mode**

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# The server will restart automatically when you make changes
```

## ⚙️ **Configuration**

### **Environment Variables** (`.env`)

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Session Security (CHANGE IN PRODUCTION!)
SESSION_SECRET=your-super-secure-secret-key-here

# File Upload Limits
MAX_FILE_SIZE=52428800          # 50MB in bytes
MAX_FILES_PER_UPLOAD=10         # Maximum files per upload

# Security Settings
RATE_LIMIT_WINDOW_MS=900000     # 15 minutes
RATE_LIMIT_MAX_REQUESTS=20      # Max uploads per window
AUTH_RATE_LIMIT_MAX=5           # Max auth attempts per window

# Storage Configuration
UPLOAD_PATH=./uploads           # File storage directory
DB_PATH=./files.db             # SQLite database path
SESSIONS_DB_PATH=./sessions.db  # Sessions database path

# Share Link Settings
SHARE_LINK_EXPIRY_DAYS=7        # Days until share links expire
```

## 🔐 **Authentication System**

### **User Registration**
- **Email Validation** - Must be valid email format
- **Password Requirements** - Minimum 6 characters
- **Duplicate Prevention** - Email addresses must be unique
- **Secure Storage** - Passwords hashed with bcrypt (10 rounds)

### **Login Process**
1. User enters email and password
2. Server validates credentials against database
3. Password verified using bcrypt comparison
4. Session created and stored in SQLite
5. User redirected to main application

### **Session Management**
- **Secure Cookies** - HttpOnly, Secure in production
- **24-Hour Expiry** - Sessions automatically expire
- **SQLite Storage** - Sessions stored in separate database
- **Cross-Request Persistence** - Maintains login state

### **Security Features**
- **Rate Limiting** - 5 auth attempts per 15 minutes per IP
- **Session Validation** - Every request validates active session
- **Automatic Cleanup** - Expired sessions removed automatically
- **CSRF Protection** - Session-based security

## 🔗 **File Sharing System**

### **Creating Share Links**
1. Upload a file to your account
2. Click the "🔗 Share" button on any file
3. System generates unique 64-character token
4. Share link valid for 7 days (configurable)
5. Copy and share the link with anyone

### **Share Link Format**
```
https://yourdomain.com/api/share/a1b2c3d4e5f6...
```

### **Public Access**
- **No Registration Required** - Recipients don't need accounts
- **Direct Download** - Click link to download immediately
- **Original Filename** - Downloads with correct name
- **Download Tracking** - Owner can see download count
- **Expiration Handling** - Expired links return 404

### **Share Management**
- **Visual Indicators** - Files show "📤 Shared" status
- **Easy Copying** - One-click copy to clipboard
- **Automatic Cleanup** - Expired tokens removed hourly
- **Security** - Tokens are cryptographically secure

## 🛠️ **Database Schema**

### **Users Table**
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,           -- UUID for user
    name TEXT NOT NULL,            -- Full name
    email TEXT UNIQUE NOT NULL,    -- Email (unique)
    password_hash TEXT NOT NULL,   -- bcrypt hash
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Files Table (Enhanced)**
```sql
CREATE TABLE files (
    id TEXT PRIMARY KEY,           -- UUID for file
    user_id TEXT NOT NULL,         -- Owner's user ID
    original_name TEXT NOT NULL,   -- Original filename
    filename TEXT NOT NULL,        -- Stored filename (unique)
    mimetype TEXT NOT NULL,        -- File MIME type
    size INTEGER NOT NULL,         -- File size in bytes
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    download_count INTEGER DEFAULT 0,
    share_token TEXT,              -- Share link token
    share_expires DATETIME,        -- Share expiration
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## 🔧 **API Documentation**

### **Authentication Endpoints**

#### **Register New User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "User created successfully"
}
```

#### **User Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid-string",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### **Get Current User**
```http
GET /api/auth/me
Cookie: session-cookie
```

**Response:**
```json
{
  "id": "uuid-string",
  "name": "John Doe",
  "email": "john@example.com"
}
```

#### **Logout**
```http
POST /api/auth/logout
Cookie: session-cookie
```

### **File Management Endpoints (Authenticated)**

#### **Upload Files**
```http
POST /api/upload
Content-Type: multipart/form-data
Cookie: session-cookie

# Form data with 'files' field containing file(s)
```

#### **Get User's Files**
```http
GET /api/files
Cookie: session-cookie
```

**Response:**
```json
[
  {
    "id": "uuid-string",
    "name": "document.pdf",
    "type": "application/pdf",
    "size": 1024576,
    "upload_date": "2024-01-15T10:30:00.000Z",
    "download_count": 3,
    "share_link": "/api/share/abc123..." // if shared
  }
]
```

#### **Create Share Link**
```http
POST /api/files/{file-id}/share
Cookie: session-cookie
```

**Response:**
```json
{
  "shareUrl": "https://domain.com/api/share/abc123...",
  "expires": "2024-01-22T10:30:00.000Z"
}
```

#### **Public Share Download**
```http
GET /api/share/{share-token}
# No authentication required
```

## 🎨 **UI/UX Features**

### **Authentication Modal**
- **Smooth Transitions** - Animated switch between login/register
- **Form Validation** - Real-time password and email validation
- **Error Handling** - Clear error messages for failed attempts
- **Responsive Design** - Perfect on mobile and desktop
- **Security Indicators** - Visual feedback for secure connections

### **User Dashboard**
- **Personalized Header** - Shows user name and logout option
- **File Statistics** - Personal file counts and usage
- **Quick Actions** - Easy access to upload and refresh
- **Visual Hierarchy** - Clear separation of user content

### **Share Interface**
- **Intuitive Sharing** - One-click share button on each file
- **Modal Dialog** - Clean share link generation interface
- **Copy to Clipboard** - Easy link copying with feedback
- **Status Indicators** - Visual cues for shared files
- **Expiration Info** - Clear expiration dates and warnings

## 🚀 **Production Deployment**

### **Security Checklist**
- [ ] **Change SESSION_SECRET** - Use strong random key
- [ ] **Enable HTTPS** - SSL/TLS certificates required
- [ ] **Secure Cookies** - Set NODE_ENV=production
- [ ] **Rate Limiting** - Configure appropriate limits
- [ ] **Database Backups** - Regular automated backups
- [ ] **File Storage** - Consider cloud storage for scale

### **Deployment Steps**

```bash
# 1. Set production environment
export NODE_ENV=production
export SESSION_SECRET="your-super-secure-random-key"

# 2. Install production dependencies
npm ci --only=production

# 3. Create production databases
# (Files will be created automatically)

# 4. Configure reverse proxy (nginx recommended)
# 5. Set up SSL certificates
# 6. Configure firewall rules
# 7. Set up monitoring and logging

# 8. Start the application
npm start
```

### **Nginx Configuration Example**
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 **Monitoring & Analytics**

### **Built-in Metrics**
- **User Registration** - Track new user signups
- **File Uploads** - Monitor upload volume and sizes
- **Share Activity** - Track link generation and usage
- **Download Statistics** - Per-file and per-user analytics
- **Session Activity** - Login frequency and duration

### **Log Management**
```bash
# Application logs
tail -f logs/app.log

# Access logs (nginx)
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log

# Database queries (if enabled)
tail -f logs/db.log
```

## 🔒 **Security Best Practices**

### **Implemented Security**
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Session Security** - HttpOnly, Secure cookies
- ✅ **Rate Limiting** - Prevents brute force attacks
- ✅ **Input Validation** - Email and password requirements
- ✅ **File Type Filtering** - Blocks dangerous executables
- ✅ **CSRF Protection** - Session-based request validation
- ✅ **SQL Injection Protection** - Parameterized queries
- ✅ **XSS Prevention** - Input sanitization

### **Additional Recommendations**
- [ ] **Two-Factor Authentication** - TOTP implementation
- [ ] **Email Verification** - Verify email addresses
- [ ] **Password Reset** - Secure reset functionality
- [ ] **Account Lockout** - Lock accounts after failed attempts
- [ ] **Audit Logging** - Log all security events
- [ ] **File Encryption** - Encrypt files at rest
- [ ] **Virus Scanning** - Scan uploaded files

## 🧪 **Testing the Authentication**

### **Manual Testing Checklist**

#### **Registration Flow**
- [ ] Register with valid email and password
- [ ] Try to register with existing email (should fail)
- [ ] Try weak password under 6 characters (should fail)
- [ ] Try invalid email format (should fail)
- [ ] Verify rate limiting after 5 attempts

#### **Login Flow**
- [ ] Login with correct credentials
- [ ] Try wrong password (should fail)
- [ ] Try non-existent email (should fail)
- [ ] Verify session persistence across page reloads
- [ ] Test automatic logout after 24 hours

#### **File Management**
- [ ] Upload files while logged in
- [ ] Verify only your files appear in list
- [ ] Test file download functionality
- [ ] Create share links and test public access
- [ ] Delete files and verify removal

#### **Share Link Testing**
- [ ] Generate share link for uploaded file
- [ ] Access share link in private/incognito browser
- [ ] Verify download works without login
- [ ] Test expired share links (manually expire in DB)
- [ ] Verify download counter increments

## 🚀 **Performance Optimization**

### **Current Optimizations**
- **SQLite Indexes** - Optimized queries for users and files
- **Session Caching** - In-memory session storage
- **Static File Caching** - Service worker caching
- **Compression** - Gzip compression for responses
- **Connection Pooling** - Efficient database connections

### **Scaling Considerations**

#### **Database Scaling**
```javascript
// For high traffic, consider PostgreSQL
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000
});
```

#### **Session Scaling**
```javascript
// For multiple servers, use Redis
const RedisStore = require('connect-redis')(session);
app.use(session({
  store: new RedisStore({ client: redisClient }),
  // ... other options
}));
```

## 📈 **Usage Analytics**

### **User Metrics**
- **Registration Rate** - New users per day/week/month
- **Active Users** - Daily/weekly/monthly active users
- **Session Duration** - Average time users spend logged in
- **Feature Usage** - Upload vs share vs download activity

### **File Metrics**
- **Upload Volume** - Files and total size per period
- **Popular File Types** - Most common MIME types
- **Share Adoption** - Percentage of files that get shared
- **Download Patterns** - Peak usage times and patterns

## ❓ **Troubleshooting**

### **Common Issues**

#### **Cannot Register/Login**
```bash
# Check database permissions
ls -la files.db sessions.db

# Verify bcrypt installation
npm list bcrypt

# Check session configuration
grep -n "SESSION_SECRET" .env
```

#### **Share Links Not Working**
```bash
# Check database schema
sqlite3 files.db ".schema files"

# Verify share token generation
sqlite3 files.db "SELECT share_token, share_expires FROM files WHERE share_token IS NOT NULL;"
```

#### **Files Not Uploading**
```bash
# Check upload directory permissions
ls -la uploads/

# Verify user session
sqlite3 sessions.db ".tables"

# Check rate limiting
grep -n "rate" server.js
```

## 🤝 **Contributing**

We welcome contributions! Here's how to get started:

1. **Fork the Repository**
2. **Create Feature Branch** (`git checkout -b feature/amazing-feature`)
3. **Add Authentication Tests** (if applicable)
4. **Commit Changes** (`git commit -m 'Add amazing feature'`)
5. **Push to Branch** (`git push origin feature/amazing-feature`)
6. **Open Pull Request**

### **Development Guidelines**
- **Security First** - All auth features must be secure
- **Test Coverage** - Include tests for new functionality
- **Documentation** - Update README for new features
- **Backward Compatibility** - Don't break existing APIs

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Express.js** for the robust web framework
- **bcrypt** for secure password hashing
- **SQLite** for the reliable database
- **Multer** for file upload handling
- **Express-session** for session management
- All the open-source contributors who make projects like this possible

---

**File Manager Pro v2.0** - Built with ❤️ and 🔐 for secure file management

### 🎯 **What's New Summary**

✅ **Complete user authentication system**  
✅ **Secure file sharing with expiring links**  
✅ **User-specific file isolation**  
✅ **Modern authentication UI**  
✅ **Enhanced security features**  
✅ **Production-ready deployment guide**

Ready to deploy your secure file management system! 🚀
