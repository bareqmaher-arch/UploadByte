# 📧 Email Verification Setup Guide

Your File Manager Pro already has email verification built-in! You just need to configure Gmail to send verification emails.

## 🚀 Quick Setup (5 minutes)

### Step 1: Enable Gmail App Passwords

1. **Go to your Google Account**: https://myaccount.google.com/security
2. **Enable 2-Factor Authentication** (if not already enabled)
3. **Generate an App Password**:
   - Click "App passwords" 
   - Select "Mail" as the app
   - Select "Other" as the device and name it "File Manager Pro"
   - Copy the 16-character password (like: `abcd efgh ijkl mnop`)

### Step 2: Update Your .env File

```bash
# Replace with your actual Gmail and app password
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

### Step 3: Test the Setup

1. **Start your server**: `npm start`
2. **Try to register** a new account
3. **Check your email** for the verification link
4. **Click the verification link** to activate your account

## 📋 What's Already Working

Your system already includes:

✅ **User Registration** with email verification  
✅ **Verification Email Templates** (beautiful HTML emails)  
✅ **Email Verification Endpoints** (`/api/auth/verify`)  
✅ **Resend Verification** functionality  
✅ **Password Reset** via email  
✅ **Upload Protection** (only verified users can upload)  
✅ **Beautiful UI** for verification status  

## 🔧 How It Works

1. **User Registers** → System generates verification token
2. **Email Sent** → Beautiful HTML email with verification link
3. **User Clicks Link** → Account gets verified automatically
4. **User Can Upload** → Only verified users can upload files

## 🎨 Email Templates

Your system sends beautiful HTML emails with:
- Branded header with your project name
- Clear call-to-action buttons
- Expiration warnings
- Professional styling
- Mobile-responsive design

## 🔒 Security Features

- **24-hour verification expiry** (tokens auto-expire)
- **Secure token generation** (crypto.randomBytes)
- **Rate limiting** (5 attempts per 15 minutes)
- **Auto cleanup** (expired tokens removed daily)
- **Upload protection** (unverified users can't upload)

## 🚨 Troubleshooting

### "Email sending failed"
- Check your Gmail credentials in `.env`
- Make sure you're using an App Password, not your regular password
- Verify 2FA is enabled on your Google account

### "Authentication failed"
- Double-check the EMAIL_USER and EMAIL_PASS values
- Make sure there are no extra spaces in your .env file
- Try generating a new App Password

### "Verification link expired"
- Links expire after 24 hours
- Use the "Resend verification email" feature
- Check spam/junk folder

## 🌟 Testing Without Email (Demo Mode)

If you don't want to configure email yet:
- Your system will still work in "demo mode"
- Verification tokens will be logged to console
- You can manually verify users in the database
- All other features work normally

## 📧 Example Verification Email

When configured, your users receive emails like this:

```
Subject: Verify Your Email - File Manager Pro

[Beautiful HTML email with your branding]
- Welcome message with user's name
- Big "Verify Email Address" button
- Features overview (100GB uploads, secure sharing)
- Professional footer with your GitHub link
- 24-hour expiration warning
```

## 🔄 User Flow

1. **Registration**: User enters name, email, password
2. **Email Sent**: "Check your email" message appears
3. **Verification**: User clicks link in email
4. **Success**: "Email verified!" message with login prompt
5. **Login**: User can now login and upload files
6. **Upload Protection**: Unverified users see warning banner

## ⚙️ Advanced Configuration

### Custom Email Templates
Edit the email templates in `server.js` around lines 150-250:
- `sendVerificationEmail()` function
- `sendPasswordResetEmail()` function

### Change Expiration Time
```javascript
// In server.js, line ~200
const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
```

### Custom Email Service
Replace Gmail with another service in `server.js`:
```javascript
const EMAIL_CONFIG = {
  host: 'smtp.yourservice.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
};
```

## 🎯 Production Tips

1. **Use a dedicated Gmail account** for sending emails
2. **Set BASE_URL** to your production domain
3. **Configure proper DNS** (SPF, DKIM) for better delivery
4. **Monitor email delivery** rates
5. **Keep backup of your app password** securely

---

🎉 **Your email verification system is ready to go!** Just add your Gmail credentials and start verifying users!