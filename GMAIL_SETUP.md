# 📧 Gmail Setup for Email Verification

## 🚀 Quick 5-Minute Setup

### Step 1: Enable 2-Factor Authentication

1. **Go to Google Account Security**: https://myaccount.google.com/security
2. **Click "2-Step Verification"**
3. **Follow the setup process** (use your phone number)
4. **Complete verification** with your phone

### Step 2: Generate App Password

1. **Still in Security settings**, scroll down to "2-Step Verification"
2. **Click "App passwords"** (you might need to sign in again)
3. **Select "Mail" as the app**
4. **Select "Other (Custom name)" as device**
5. **Enter "File Manager Pro"** as the name
6. **Click "Generate"**
7. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

### Step 3: Update Your .env File

```bash
# Open your .env file and update these lines:
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=abcdefghijklmnop

# Replace with your actual Gmail and the app password (no spaces)
```

### Step 4: Test Your Setup

```bash
# Start your server
npm start

# Try registering a new user
# Check your email for verification link
```

## 📱 Screenshots Guide

### 1. Google Account Security Page
- Go to: https://myaccount.google.com/security
- Look for "2-Step Verification" section
- If not enabled, click "Get started"

### 2. 2-Step Verification Setup
- Choose verification method (phone is easiest)
- Enter your phone number
- Verify with the code sent to your phone
- Confirm setup

### 3. App Passwords Section
- In "2-Step Verification", scroll to "App passwords"
- Click "App passwords"
- You might need to re-enter your password

### 4. Generate App Password
- App: Select "Mail"
- Device: Select "Other (Custom name)"
- Name: Enter "File Manager Pro"
- Click "Generate"

### 5. Copy the Password
- Google shows a 16-character password
- Copy it exactly (no spaces needed in .env)
- Store it securely

## 🔧 .env File Example

```bash
# Complete .env file example
PORT=3001
NODE_ENV=production
BASE_URL=http://localhost:3001
SESSION_SECRET=your-super-secure-secret-key-change-this-in-production-2024

# Gmail Configuration (IMPORTANT: Use App Password, not regular password)
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=abcdefghijklmnop

# Other settings...
MAX_FILE_SIZE=107374182400
MAX_FILES_PER_UPLOAD=10
UPLOAD_PATH=./uploads
```

## ✅ Testing Your Email Setup

### 1. Check Server Logs
```bash
npm start

# Look for these messages:
# ✅ "📧 Email transporter configured"
# ❌ "⚠️ Email not configured"
```

### 2. Test Registration
1. Open your app: http://localhost:3001
2. Click "Create Account"
3. Fill in the form with a real email
4. Click "Create Account"
5. Check your email inbox

### 3. Expected Results
- **Success**: Email arrives within 1-2 minutes
- **Failure**: Check server logs for error messages

## 🚨 Common Issues & Solutions

### Issue: "Invalid credentials"
**Solution**: 
- Make sure you're using an App Password, not your regular Gmail password
- Double-check EMAIL_USER and EMAIL_PASS in .env
- Ensure 2FA is enabled on your Google account

### Issue: "Authentication failed"
**Solution**:
- Generate a new App Password
- Remove any spaces from the password in .env
- Restart your server after changing .env

### Issue: "Email not sending"
**Solution**:
- Check if EMAIL_USER and EMAIL_PASS are correctly set
- Verify your Gmail account is active
- Check spam folder for test emails

### Issue: "App passwords not available"
**Solution**:
- Enable 2-Factor Authentication first
- Wait 5-10 minutes after enabling 2FA
- Sign out and back into Google Account

## 🔒 Security Best Practices

### 1. Use a Dedicated Gmail Account
```bash
# Create a separate Gmail for your app
# Example: filemanagerpro2024@gmail.com
```

### 2. Store Credentials Securely
```bash
# Never commit .env to git
echo ".env" >> .gitignore

# Use environment variables in production
export EMAIL_USER=your.email@gmail.com
export EMAIL_PASS=your-app-password
```

### 3. Monitor Usage
- Check Google Account activity regularly
- Revoke app passwords if compromised
- Generate new passwords periodically

## 🌟 Alternative Email Services

### SendGrid (Recommended for Production)
```javascript
const EMAIL_CONFIG = {
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
};
```

### Mailgun
```javascript
const EMAIL_CONFIG = {
  host: 'smtp.mailgun.org',
  port: 587,
  auth: {
    user: process.env.MAILGUN_SMTP_LOGIN,
    pass: process.env.MAILGUN_SMTP_PASSWORD
  }
};
```

### Outlook/Hotmail
```javascript
const EMAIL_CONFIG = {
  service: 'hotmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // App password required
  }
};
```

## 📧 Email Template Preview

Your users will receive beautiful emails like this:

```
Subject: Verify Your Email - File Manager Pro

[📁 File Manager Pro Header]

Hi John!

Thank you for registering with File Manager Pro. To complete your 
registration and start uploading files, please verify your email address.

[Verify Email Address Button]

Or copy this link: https://localhost:3001/api/auth/verify?token=abc123...

Important:
• This verification link will expire in 24 hours
• You cannot upload files until your email is verified
• If you didn't create this account, please ignore this email

Once verified, you'll be able to:
• 🔥 Upload files up to 100GB each
• 🔗 Share files with secure links
• 📱 Access from any device
• 🔒 Secure file management

© 2024 File Manager Pro
Created by Bareq Maher
```

## 🎯 Quick Checklist

- [ ] Enable 2FA on Google Account
- [ ] Generate App Password for Mail
- [ ] Update EMAIL_USER in .env
- [ ] Update EMAIL_PASS in .env (app password)
- [ ] Restart server
- [ ] Test with real email registration
- [ ] Check email inbox (and spam folder)
- [ ] Click verification link
- [ ] Confirm user can login after verification

---

🎉 **Once configured, your email verification system will work automatically!** Users will receive professional verification emails and your app will be production-ready.