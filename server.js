const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const os = require('os');
const nodemailer = require('nodemailer');
console.log(nodemailer);

// Optional authentication packages
let bcrypt, session, SQLiteStore;
let authEnabled = false;

try {
  bcrypt = require('bcrypt');
  session = require('express-session');
  SQLiteStore = require('connect-sqlite3')(session);
  authEnabled = true;
  console.log('🔐 Authentication packages loaded successfully');
} catch (error) {
  console.log('⚠️  Authentication packages not found. Running in demo mode.');
  console.log('📦 To enable full authentication, run: npm install bcrypt express-session connect-sqlite3 nodemailer');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Email configuration
const EMAIL_CONFIG = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
};

let transporter;
if (EMAIL_CONFIG.auth.user !== 'your-email@gmail.com') {
  transporter = nodemailer.createTransport(EMAIL_CONFIG);
  console.log('📧 Email transporter configured');
} else {
  console.log('⚠️  Email not configured. Set EMAIL_USER and EMAIL_PASS environment variables.');
}

// Get network IP function
function getNetworkIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Middleware setup
app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: true,
  credentials: true
}));

// Session middleware (only if packages available)
if (authEnabled) {
  app.use(session({
    store: new SQLiteStore({ db: 'sessions.db' }),
    secret: process.env.SESSION_SECRET || 'demo-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
}

// Enhanced JSON and URL parsing for large files
app.use(express.json({ limit: '100gb' }));
app.use(express.urlencoded({ limit: '100gb', extended: true }));
app.use(express.static('public'));

// Rate limiting - More lenient for large file uploads
const uploadLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window for large files
  max: 5, // Reduced max uploads per hour for large files
  message: { error: 'Too many large file uploads, please wait before uploading again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many authentication attempts, please try again later.' }
});

// Database setup
const db = new sqlite3.Database('./files.db', (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('💾 Connected to SQLite database');
  }
});

// Create tables with better error handling
db.serialize(() => {
  // Users table (if auth enabled) - Enhanced with email verification
  if (authEnabled) {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email_verified INTEGER DEFAULT 0,
        verification_token TEXT,
        verification_expires DATETIME,
        reset_token TEXT,
        reset_expires DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('👥 Users table ready with email verification');
        
        // Add missing columns if they don't exist
        db.run(`ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN verification_token TEXT`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN verification_expires DATETIME`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN reset_token TEXT`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN reset_expires DATETIME`, () => {});
      }
    });
  }

  // Files table with proper structure for large files
  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT 'demo-user',
      original_name TEXT NOT NULL,
      filename TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      size INTEGER NOT NULL,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      download_count INTEGER DEFAULT 0,
      share_token TEXT,
      share_expires DATETIME
    )
  `, (err) => {
    if (err) {
      console.error('Error creating files table:', err);
    } else {
      console.log('📁 Files table ready for large files (up to 100GB)');
      
      // Add missing columns if they don't exist
      db.run(`ALTER TABLE files ADD COLUMN share_token TEXT`, () => {});
      db.run(`ALTER TABLE files ADD COLUMN share_expires DATETIME`, () => {});
      db.run(`ALTER TABLE files ADD COLUMN user_id TEXT DEFAULT 'demo-user'`, () => {});
    }
  });
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📂 Created uploads directory for large files');
}

// Email functions
async function sendVerificationEmail(email, name, token) {
  if (!transporter) {
    console.log('📧 Email not configured, verification token:', token);
    return false;
  }

  const verificationUrl = `${process.env.BASE_URL || 'http://localhost:' + PORT}/api/auth/verify?token=${token}`;
  
  const mailOptions = {
    from: EMAIL_CONFIG.auth.user,
    to: email,
    subject: 'Verify Your Email - File Manager Pro',
    html: `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px; 
            }
            .header { 
                background: linear-gradient(135deg, #4CAF50, #45a049); 
                color: white; 
                padding: 30px; 
                text-align: center; 
                border-radius: 10px 10px 0 0; 
            }
            .content { 
                background: #f9f9f9; 
                padding: 30px; 
                border-radius: 0 0 10px 10px; 
            }
            .button { 
                display: inline-block; 
                background: #4CAF50; 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 8px; 
                margin: 20px 0; 
                font-weight: bold; 
            }
            .footer { 
                text-align: center; 
                margin-top: 30px; 
                font-size: 12px; 
                color: #666; 
            }
            .copyright {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 11px;
                color: #888;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📁 File Manager Pro</h1>
            <p>Welcome to the secure file management system</p>
        </div>
        <div class="content">
            <h2>Hi ${name}!</h2>
            <p>Thank you for registering with File Manager Pro. To complete your registration and start uploading files, please verify your email address.</p>
            
            <p><strong>Click the button below to verify your email:</strong></p>
            <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px;">
                ${verificationUrl}
            </p>
            
            <p><strong>Important:</strong></p>
            <ul>
                <li>This verification link will expire in 24 hours</li>
                <li>You cannot upload files until your email is verified</li>
                <li>If you didn't create this account, please ignore this email</li>
            </ul>
            
            <p>Once verified, you'll be able to:</p>
            <ul>
                <li>🔥 Upload files up to 100GB each</li>
                <li>🔗 Share files with secure links</li>
                <li>📱 Access from any device</li>
                <li>🔒 Secure file management</li>
            </ul>
        </div>
        <div class="footer">
            <p>This email was sent from File Manager Pro</p>
            <p>If you have any questions, please contact support.</p>
            
            <div class="copyright">
                <p>© 2024 File Manager Pro</p>
                <p>Created by <a href="https://github.com/bareqmaher-arch" target="_blank" style="color: #4CAF50;">Bareq Maher</a></p>
            </div>
        </div>
    </body>
    </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('📧 Email sending failed:', error);
    return false;
  }
}

async function sendPasswordResetEmail(email, name, token) {
  if (!transporter) {
    console.log('📧 Email not configured, reset token:', token);
    return false;
  }

  const resetUrl = `${process.env.BASE_URL || 'http://localhost:' + PORT}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: EMAIL_CONFIG.auth.user,
    to: email,
    subject: 'Password Reset - File Manager Pro',
    html: `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px; 
            }
            .header { 
                background: linear-gradient(135deg, #f56565, #e53e3e); 
                color: white; 
                padding: 30px; 
                text-align: center; 
                border-radius: 10px 10px 0 0; 
            }
            .content { 
                background: #f9f9f9; 
                padding: 30px; 
                border-radius: 0 0 10px 10px; 
            }
            .button { 
                display: inline-block; 
                background: #f56565; 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 8px; 
                margin: 20px 0; 
                font-weight: bold; 
            }
            .footer { 
                text-align: center; 
                margin-top: 30px; 
                font-size: 12px; 
                color: #666; 
            }
            .copyright {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 11px;
                color: #888;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔒 Password Reset</h1>
            <p>File Manager Pro</p>
        </div>
        <div class="content">
            <h2>Hi ${name}!</h2>
            <p>We received a request to reset your password for your File Manager Pro account.</p>
            
            <p><strong>Click the button below to reset your password:</strong></p>
            <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px;">
                ${resetUrl}
            </p>
            
            <p><strong>Important:</strong></p>
            <ul>
                <li>This reset link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will remain unchanged until you create a new one</li>
            </ul>
            
            <p><strong>Security tip:</strong> Choose a strong password with at least 8 characters, including numbers and symbols.</p>
        </div>
        <div class="footer">
            <p>This email was sent from File Manager Pro</p>
            <p>If you have any questions, please contact support.</p>
            
            <div class="copyright">
                <p>© 2024 File Manager Pro</p>
                <p>Created by <a href="https://github.com/bareqmaher-arch" target="_blank" style="color: #f56565;">Bareq Maher</a></p>
            </div>
        </div>
    </body>
    </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('📧 Email sending failed:', error);
    return false;
  }
}

// Authentication middleware
function requireAuth(req, res, next) {
  if (!authEnabled) {
    // Demo mode - allow all requests
    req.user = { id: 'demo-user', name: 'Demo User', email: 'demo@example.com' };
    return next();
  }
  
  if (req.session && req.session.userId) {
    req.user = {
      id: req.session.userId,
      name: req.session.userName,
      email: req.session.userEmail,
      emailVerified: req.session.emailVerified
    };
    return next();
  }
  
  return res.status(401).json({ error: 'Authentication required' });
}

// Require verified email middleware
function requireVerifiedEmail(req, res, next) {
  if (!authEnabled) {
    return next();
  }
  
  if (req.user && req.user.emailVerified) {
    return next();
  }
  
  return res.status(403).json({ 
    error: 'Email verification required',
    message: 'Please verify your email before uploading files'
  });
}

// Enhanced Multer configuration for 100GB files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueId = crypto.randomUUID();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueId}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 * 1024, // 100GB limit
    files: 10, // Maximum 10 files at once
    fieldSize: 1024 * 1024 * 1024, // 1GB field size limit
    parts: 1000 // Maximum parts in multipart form
  },
  fileFilter: (req, file, cb) => {
    // Enhanced file filtering for security
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.app'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (dangerousExtensions.includes(fileExtension)) {
      return cb(new Error(`File type ${fileExtension} not allowed for security reasons`), false);
    }
    
    // Log large file uploads
    if (file.size && file.size > 1024 * 1024 * 1024) { // > 1GB
      console.log(`📦 Large file detected: ${file.originalname} (${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB)`);
    }
    
    cb(null, true);
  }
});

// ==================== AUTHENTICATION ROUTES ====================

if (authEnabled) {
  // Register with email verification
  app.post('/api/auth/register', authLimit, async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
      }

      // Check if user exists
      db.get('SELECT id, email_verified FROM users WHERE email = ?', [email], async (err, existingUser) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (existingUser) {
          if (existingUser.email_verified) {
            return res.status(400).json({ error: 'User already exists with this email' });
          } else {
            return res.status(400).json({ 
              error: 'Email already registered but not verified. Please check your email for verification link.' 
            });
          }
        }

        // Create user
        const passwordHash = await bcrypt.hash(password, 10);
        const userId = crypto.randomUUID();
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        db.run(
          `INSERT INTO users (id, name, email, password_hash, verification_token, verification_expires) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, name, email, passwordHash, verificationToken, verificationExpires.toISOString()],
          async function(err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Failed to create user' });
            }

            // Send verification email
            const emailSent = await sendVerificationEmail(email, name, verificationToken);
            
            console.log(`👤 New user registered: ${email} (verification email sent: ${emailSent})`);
            
            res.json({ 
              message: 'Account created successfully! Please check your email to verify your account.',
              emailSent: emailSent
            });
          }
        );
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Email verification endpoint
  app.get('/api/auth/verify', async (req, res) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ error: 'Verification token is required' });
      }

      db.get(
        'SELECT * FROM users WHERE verification_token = ? AND verification_expires > datetime("now")',
        [token],
        (err, user) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
          }

          // Verify the user
          db.run(
            'UPDATE users SET email_verified = 1, verification_token = NULL, verification_expires = NULL WHERE id = ?',
            [user.id],
            function(err) {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to verify email' });
              }

              console.log(`✅ Email verified for user: ${user.email}`);
              
              // Redirect to success page or return success message
              res.redirect('/?verified=true');
            }
          );
        }
      );
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Resend verification email
  app.post('/api/auth/resend-verification', authLimit, async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        if (user.email_verified) {
          return res.status(400).json({ error: 'Email already verified' });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        db.run(
          'UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?',
          [verificationToken, verificationExpires.toISOString(), user.id],
          async function(err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Failed to generate verification token' });
            }

            // Send verification email
            const emailSent = await sendVerificationEmail(email, user.name, verificationToken);
            
            console.log(`📧 Verification email resent to: ${email}`);
            
            res.json({ 
              message: 'Verification email sent! Please check your email.',
              emailSent: emailSent
            });
          }
        );
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Login (only verified users can login)
  app.post('/api/auth/login', authLimit, async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!user.email_verified) {
          return res.status(401).json({ 
            error: 'Please verify your email before logging in',
            needsVerification: true 
          });
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Create session
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.userName = user.name;
        req.session.emailVerified = user.email_verified;

        console.log(`🔑 User logged in: ${email}`);
        res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.email_verified
          }
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // Forgot password
  app.post('/api/auth/forgot-password', authLimit, async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      db.get('SELECT * FROM users WHERE email = ? AND email_verified = 1', [email], async (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          // Don't reveal if email exists or not
          return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        db.run(
          'UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?',
          [resetToken, resetExpires.toISOString(), user.id],
          async function(err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Failed to generate reset token' });
            }

            // Send reset email
            const emailSent = await sendPasswordResetEmail(email, user.name, resetToken);
            
            console.log(`🔒 Password reset requested for: ${email}`);
            
            res.json({ 
              message: 'If an account with that email exists, a reset link has been sent.',
              emailSent: emailSent
            });
          }
        );
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Reset password
  app.post('/api/auth/reset-password', authLimit, async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      db.get(
        'SELECT * FROM users WHERE reset_token = ? AND reset_expires > datetime("now")',
        [token],
        async (err, user) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
          }

          // Hash new password
          const passwordHash = await bcrypt.hash(password, 10);

          // Update password and clear reset token
          db.run(
            'UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
            [passwordHash, user.id],
            function(err) {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to reset password' });
              }

              console.log(`🔒 Password reset completed for: ${user.email}`);
              
              res.json({ message: 'Password reset successfully! You can now login with your new password.' });
            }
          );
        }
      );
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get current user
  app.get('/api/auth/me', requireAuth, (req, res) => {
    if (!authEnabled) {
      return res.json({
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@example.com',
        emailVerified: true
      });
    }

    db.get('SELECT id, name, email, email_verified FROM users WHERE id = ?', [req.session.userId], (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({
        ...user,
        emailVerified: Boolean(user.email_verified)
      });
    });
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logout successful' });
      });
    } else {
      res.json({ message: 'Logout successful' });
    }
  });
} else {
  // Demo mode routes
  app.get('/api/auth/me', (req, res) => {
    res.json({
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@example.com',
      emailVerified: true
    });
  });

  app.post('/api/auth/login', (req, res) => {
    res.json({
      message: 'Login successful (demo mode)',
      user: {
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@example.com',
        emailVerified: true
      }
    });
  });

  app.post('/api/auth/register', (req, res) => {
    res.json({ message: 'User created successfully (demo mode)' });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Logout successful (demo mode)' });
  });

  app.post('/api/auth/resend-verification', (req, res) => {
    res.json({ message: 'Verification email sent (demo mode)' });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    res.json({ message: 'Reset email sent (demo mode)' });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    res.json({ message: 'Password reset successful (demo mode)' });
  });
}

// ==================== FILE ROUTES - Enhanced for 100GB ==================== 

// Upload files with enhanced handling for large files (requires verified email)
app.post('/api/upload', requireAuth, requireVerifiedEmail, uploadLimit, (req, res) => {
  console.log(`📤 Starting upload process for user: ${req.user.id}`);
  
  // Set longer timeout for large file uploads
  req.setTimeout(2 * 60 * 60 * 1000); // 2 hours timeout
  res.setTimeout(2 * 60 * 60 * 1000);
  
  const uploadMiddleware = upload.array('files');
  
  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error('❌ Upload middleware error:', err);
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large (maximum 100GB per file)' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: 'Too many files (maximum 10 files at once)' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ error: 'Unexpected file field' });
        }
      }
      
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const uploadedFiles = [];
      let completed = 0;
      let hasError = false;
      const userId = req.user ? req.user.id : 'demo-user';

      console.log(`📤 Processing ${req.files.length} files for user: ${userId}`);

      req.files.forEach((file, index) => {
        if (hasError) return;
        
        const fileId = crypto.randomUUID();
        const fileSizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
        
        console.log(`Processing file ${index + 1}/${req.files.length}: ${file.originalname} (${fileSizeGB} GB)`);
        
        // Log large file uploads
        if (file.size > 1024 * 1024 * 1024) { // > 1GB
          console.log(`🔥 Large file upload: ${file.originalname} - ${fileSizeGB} GB`);
        }
        
        const query = `INSERT INTO files (id, user_id, original_name, filename, mimetype, size) VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [fileId, userId, file.originalname, file.filename, file.mimetype, file.size];
        
        db.run(query, params, function(err) {
          if (err) {
            console.error('❌ Database error details:', err);
            console.error('Query:', query);
            console.error('Params:', params);
            
            if (!hasError) {
              hasError = true;
              return res.status(500).json({ 
                error: 'Database error during upload',
                details: err.message 
              });
            }
            return;
          }
          
          console.log(`✅ File saved to database: ${file.originalname} (${fileSizeGB} GB)`);
          
          uploadedFiles.push({
            id: fileId,
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
            sizeGB: fileSizeGB
          });
          
          completed++;
          if (completed === req.files.length && !hasError) {
            const totalSizeGB = (req.files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024 * 1024)).toFixed(2);
            console.log(`🎉 Successfully uploaded ${completed} files (Total: ${totalSizeGB} GB)`);
            res.json({
              message: 'Files uploaded successfully',
              files: uploadedFiles,
              totalSize: totalSizeGB + ' GB'
            });
          }
        });
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({ error: 'Upload failed: ' + error.message });
    }
  });
});

// Get user's files
app.get('/api/files', requireAuth, (req, res) => {
  const userId = req.user.id;
  
  db.all(
    `SELECT id, original_name as name, mimetype as type, size, 
     upload_date, download_count, share_token
     FROM files 
     WHERE user_id = ?
     ORDER BY upload_date DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const filesWithShareInfo = rows.map(file => ({
        ...file,
        share_link: file.share_token ? `/api/share/${file.share_token}` : null
      }));
      
      res.json(filesWithShareInfo);
    }
  );
});

// Download file with support for large files
app.get('/api/download/:id', requireAuth, (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;
  
  // Set longer timeout for large file downloads
  req.setTimeout(2 * 60 * 60 * 1000); // 2 hours timeout
  res.setTimeout(2 * 60 * 60 * 1000);
  
  db.get(
    'SELECT * FROM files WHERE id = ? AND user_id = ?',
    [fileId, userId],
    (err, file) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      const filePath = path.join(uploadsDir, file.filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on disk' });
      }
      
      // Log large file downloads
      const fileSizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
      if (file.size > 1024 * 1024 * 1024) { // > 1GB
        console.log(`📥 Large file download: ${file.original_name} (${fileSizeGB} GB)`);
      }
      
      // Increment download count
      db.run('UPDATE files SET download_count = download_count + 1 WHERE id = ?', [fileId]);
      
      // Set headers for large file downloads
      res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
      res.setHeader('Content-Type', file.mimetype);
      res.setHeader('Content-Length', file.size);
      res.setHeader('Accept-Ranges', 'bytes');
      
      // Handle range requests for large files (resumable downloads)
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : file.size - 1;
        const chunksize = (end - start) + 1;
        
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${file.size}`);
        res.setHeader('Content-Length', chunksize);
        
        const fileStream = fs.createReadStream(filePath, { start, end });
        fileStream.pipe(res);
      } else {
        // Stream entire file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
      }
      
      console.log(`📥 Downloaded: ${file.original_name} (${fileSizeGB} GB)`);
    }
  );
});

// Create share link
app.post('/api/files/:id/share', requireAuth, (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;
  
  db.get('SELECT id, original_name, size FROM files WHERE id = ? AND user_id = ?', [fileId, userId], (err, file) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const shareToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    db.run(
      'UPDATE files SET share_token = ?, share_expires = ? WHERE id = ?',
      [shareToken, expiresAt.toISOString(), fileId],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to create share link' });
        }
        
        const shareUrl = `${req.protocol}://${req.get('host')}/api/share/${shareToken}`;
        const fileSizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
        
        console.log(`🔗 Share link created: ${shareToken} for ${file.original_name} (${fileSizeGB} GB)`);
        
        res.json({
          shareUrl: shareUrl,
          expires: expiresAt.toISOString()
        });
      }
    );
  });
});

// Public share download with large file support
app.get('/api/share/:token', (req, res) => {
  const shareToken = req.params.token;
  
  // Set longer timeout for large shared file downloads
  req.setTimeout(2 * 60 * 60 * 1000); // 2 hours timeout
  res.setTimeout(2 * 60 * 60 * 1000);
  
  db.get(
    'SELECT * FROM files WHERE share_token = ? AND share_expires > datetime("now")',
    [shareToken],
    (err, file) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!file) {
        return res.status(404).json({ error: 'Share link not found or expired' });
      }
      
      const filePath = path.join(uploadsDir, file.filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on disk' });
      }
      
      // Log large shared file downloads
      const fileSizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
      if (file.size > 1024 * 1024 * 1024) { // > 1GB
        console.log(`🌐 Large shared file download: ${file.original_name} (${fileSizeGB} GB)`);
      }
      
      // Increment download count
      db.run('UPDATE files SET download_count = download_count + 1 WHERE id = ?', [file.id]);
      
      // Set headers for large file downloads
      res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
      res.setHeader('Content-Type', file.mimetype);
      res.setHeader('Content-Length', file.size);
      res.setHeader('Accept-Ranges', 'bytes');
      
      // Handle range requests for large files (resumable downloads)
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : file.size - 1;
        const chunksize = (end - start) + 1;
        
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${file.size}`);
        res.setHeader('Content-Length', chunksize);
        
        const fileStream = fs.createReadStream(filePath, { start, end });
        fileStream.pipe(res);
      } else {
        // Stream entire file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
      }
      
      console.log(`🌐 Public download via share: ${file.original_name} (${fileSizeGB} GB)`);
    }
  );
});

// Delete file
app.delete('/api/files/:id', requireAuth, (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;
  
  db.get('SELECT filename, original_name, size FROM files WHERE id = ? AND user_id = ?', [fileId, userId], (err, file) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    db.run('DELETE FROM files WHERE id = ? AND user_id = ?', [fileId, userId], (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Delete physical file
      const filePath = path.join(uploadsDir, file.filename);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting physical file:', err);
        }
      });
      
      const fileSizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
      console.log(`🗑️ File deleted: ${file.original_name} (${fileSizeGB} GB)`);
      res.json({ message: 'File deleted successfully' });
    });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    auth: authEnabled ? 'enabled' : 'demo-mode',
    emailVerification: transporter ? 'enabled' : 'disabled',
    maxFileSize: '100GB',
    maxFiles: 10
  });
});

// Enhanced error handling middleware for large files
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (maximum 100GB per file)' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files (maximum 10 files at once)' });
    }
    if (error.code === 'LIMIT_FIELD_VALUE') {
      return res.status(400).json({ error: 'Field value too large' });
    }
    if (error.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({ error: 'Too many parts in multipart form' });
    }
  }
  
  // Handle timeout errors for large files
  if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
    return res.status(408).json({ 
      error: 'Request timeout - file may be too large or connection too slow',
      suggestion: 'Try uploading smaller files or check your internet connection'
    });
  }
  
  // Handle disk space errors
  if (error.code === 'ENOSPC') {
    return res.status(507).json({ 
      error: 'Insufficient storage space',
      suggestion: 'Server storage is full. Please contact administrator.'
    });
  }
  
  res.status(500).json({ error: error.message || 'Internal server error' });
});

// Cleanup expired share links every hour
setInterval(() => {
  db.run(
    'UPDATE files SET share_token = NULL, share_expires = NULL WHERE share_expires < datetime("now")',
    (err) => {
      if (err) {
        console.error('Error cleaning up expired share links:', err);
      } else {
        console.log('🧹 Cleaned up expired share links');
      }
    }
  );
}, 60 * 60 * 1000);

// Cleanup expired verification tokens every 24 hours
setInterval(() => {
  if (authEnabled) {
    db.run(
      'DELETE FROM users WHERE email_verified = 0 AND verification_expires < datetime("now")',
      (err) => {
        if (err) {
          console.error('Error cleaning up expired verification tokens:', err);
        } else {
          console.log('🧹 Cleaned up expired verification tokens');
        }
      }
    );
  }
}, 24 * 60 * 60 * 1000);

// Monitor disk space every 30 minutes
setInterval(() => {
  const stats = fs.statSync(uploadsDir);
  console.log(`💾 Upload directory status check completed`);
}, 30 * 60 * 1000);

// Start server with enhanced configuration for large files
const server = app.listen(PORT, '0.0.0.0', () => {
  const networkIP = getNetworkIP();
  
  console.log('\n🚀 File Manager Pro Server Started!');
  console.log('==========================================');
  console.log(`📍 Local:    http://localhost:${PORT}`);
  console.log(`📍 Network:  http://${networkIP}:${PORT}`);
  console.log(`📁 Uploads:  ${uploadsDir}`);
  console.log(`💾 Database: ${path.resolve('./files.db')}`);
  console.log(`📦 Max File Size: 100GB per file`);
  console.log(`📂 Max Files: 10 files per upload`);
  console.log(`⏱️  Upload Timeout: 2 hours`);
  
  if (authEnabled) {
    console.log('🔐 Authentication: ENABLED');
    console.log('📧 Email Verification: ' + (transporter ? 'ENABLED' : 'DISABLED'));
    console.log('🔗 Share Links: ENABLED');
    
    if (!transporter) {
      console.log('⚠️  Set EMAIL_USER and EMAIL_PASS for email verification');
    }
  } else {
    console.log('⚠️  Authentication: DEMO MODE');
    console.log('📦 To enable full auth: npm install bcrypt express-session connect-sqlite3 nodemailer');
  }
  
  console.log('==========================================\n');
  console.log('🔥 Server optimized for large file uploads up to 100GB!');
  console.log('📧 Email verification system active!');
  console.log('💡 Tips for large files:');
  console.log('   • Use stable internet connection');
  console.log('   • Upload during off-peak hours');
  console.log('   • Large files support resumable downloads');
  console.log('   • Monitor server disk space regularly');
  console.log('   • Verify email before uploading files\n');
  
  console.log('💌 Copyright by Bareq Maher');
  console.log('🔗 GitHub: https://github.com/bareqmaher-arch\n');
});

// Enhanced server configuration for large files
server.maxHeadersCount = 0; // Remove header limit
server.timeout = 2 * 60 * 60 * 1000; // 2 hours timeout
server.keepAliveTimeout = 65000; // Keep alive timeout
server.headersTimeout = 66000; // Headers timeout

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    db.close();
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    db.close();
    process.exit(0);
  });
});
