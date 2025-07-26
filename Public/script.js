const API_BASE = '/api';

// DOM elements
const authModal = document.getElementById('authModal');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const resendVerificationForm = document.getElementById('resendVerificationForm');
const verificationPending = document.getElementById('verificationPending');
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');
const showForgotPassword = document.getElementById('showForgotPassword');
const showResendVerification = document.getElementById('showResendVerification');
const showLoginFromForgot = document.getElementById('showLoginFromForgot');
const showLoginFromResend = document.getElementById('showLoginFromResend');
const authMessage = document.getElementById('authMessage');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const verificationBadge = document.getElementById('verificationBadge');
const emailVerificationWarning = document.getElementById('emailVerificationWarning');
const resendVerificationMainBtn = document.getElementById('resendVerificationMainBtn');

// Upload elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const progressBar = document.getElementById('progressBar');
const progress = document.getElementById('progress');
const message = document.getElementById('message');
const fileList = document.getElementById('fileList');
const totalFiles = document.getElementById('totalFiles');
const totalSize = document.getElementById('totalSize');
const totalDownloads = document.getElementById('totalDownloads');

// Share modal elements
const shareModal = document.getElementById('shareModal');
const shareLink = document.getElementById('shareLink');
const copyShareLink = document.getElementById('copyShareLink');
const closeShareModal = document.getElementById('closeShareModal');

// Current user state
let currentUser = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 File Manager Pro initialized with email verification');
    checkAuthStatus();
    setupEventListeners();
});

// Check if user is authenticated
async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`);
        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            showMainApp(user);
        } else {
            showAuthModal();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showAuthModal();
    }
}

// Show authentication modal
function showAuthModal() {
    authModal.style.display = 'flex';
    mainApp.style.display = 'none';
    hideAllForms();
    showLoginForm();
}

// Show main application
function showMainApp(user) {
    authModal.style.display = 'none';
    mainApp.style.display = 'block';
    userName.textContent = user.name;
    
    // Update verification badge
    updateVerificationBadge(user.emailVerified);
    
    // Show email verification warning if not verified
    if (!user.emailVerified) {
        emailVerificationWarning.classList.remove('hidden');
        uploadArea.classList.add('disabled');
        uploadBtn.disabled = true;
    } else {
        emailVerificationWarning.classList.add('hidden');
        uploadArea.classList.remove('disabled');
        uploadBtn.disabled = false;
    }
    
    loadFiles();
}

// Update verification badge
function updateVerificationBadge(isVerified) {
    if (isVerified) {
        verificationBadge.textContent = '✅ Verified';
        verificationBadge.className = 'verification-badge verified';
    } else {
        verificationBadge.textContent = '⚠️ Unverified';
        verificationBadge.className = 'verification-badge unverified';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Authentication form events
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    resendVerificationForm.addEventListener('submit', handleResendVerification);
    
    // Navigation events
    showRegisterBtn.addEventListener('click', showRegisterForm);
    showLoginBtn.addEventListener('click', showLoginForm);
    showForgotPassword.addEventListener('click', showForgotPasswordForm);
    showResendVerification.addEventListener('click', showResendVerificationForm);
    showLoginFromForgot.addEventListener('click', showLoginForm);
    showLoginFromResend.addEventListener('click', showLoginForm);
    
    // User actions
    logoutBtn.addEventListener('click', handleLogout);
    resendVerificationMainBtn.addEventListener('click', handleResendVerificationMain);
    
    // Verification pending actions
    document.getElementById('resendVerificationBtn')?.addEventListener('click', handleResendVerificationMain);
    document.getElementById('backToLoginBtn')?.addEventListener('click', showLoginForm);

    // File upload events
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileInputChange);

    // Share modal events
    closeShareModal.addEventListener('click', () => shareModal.style.display = 'none');
    copyShareLink.addEventListener('click', copyToClipboard);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Prevent default drag behaviors on document
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
}

// Hide all forms
function hideAllForms() {
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
    forgotPasswordForm.classList.add('hidden');
    resendVerificationForm.classList.add('hidden');
    verificationPending.classList.add('hidden');
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            showAuthMessage('Login successful!', 'success');
            setTimeout(() => showMainApp(data.user), 1000);
        } else {
            if (data.needsVerification) {
                showAuthMessage('Please verify your email before logging in.', 'error');
                setTimeout(() => showResendVerificationForm(null, email), 2000);
            } else {
                showAuthMessage(data.error, 'error');
            }
        }
    } catch (error) {
        showAuthMessage('Login failed. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showAuthMessage('Passwords do not match!', 'error');
        return;
    }

    if (password.length < 6) {
        showAuthMessage('Password must be at least 6 characters long!', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showVerificationPending(email);
            showToast('Account created! Check your email for verification link.', 'success');
        } else {
            showAuthMessage(data.error, 'error');
        }
    } catch (error) {
        showAuthMessage('Registration failed. Please try again.', 'error');
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;

    try {
        const response = await fetch(`${API_BASE}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            showAuthMessage('Reset link sent to your email if account exists.', 'success');
            setTimeout(showLoginForm, 3000);
        } else {
            showAuthMessage(data.error, 'error');
        }
    } catch (error) {
        showAuthMessage('Request failed. Please try again.', 'error');
    }
}

async function handleResendVerification(e) {
    e.preventDefault();
    const email = document.getElementById('resendEmail').value;

    try {
        const response = await fetch(`${API_BASE}/auth/resend-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            showAuthMessage('Verification email sent! Check your inbox.', 'success');
            showToast('Verification email sent!', 'success');
        } else {
            showAuthMessage(data.error, 'error');
        }
    } catch (error) {
        showAuthMessage('Request failed. Please try again.', 'error');
    }
}

async function handleResendVerificationMain() {
    if (!currentUser || !currentUser.email) {
        showToast('Please login first', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/resend-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Verification email sent! Check your inbox.', 'success');
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Request failed. Please try again.', 'error');
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
        currentUser = null;
        showAuthModal();
        clearForms();
        showToast('Logged out successfully', 'success');
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// Form display functions
function showLoginForm(e) {
    if (e) e.preventDefault();
    hideAllForms();
    loginForm.classList.remove('hidden');
    document.getElementById('authTitle').textContent = 'Welcome Back';
    document.getElementById('authSubtitle').textContent = 'Please login to continue';
}

function showRegisterForm(e) {
    if (e) e.preventDefault();
    hideAllForms();
    registerForm.classList.remove('hidden');
    document.getElementById('authTitle').textContent = 'Create Account';
    document.getElementById('authSubtitle').textContent = 'Join File Manager Pro';
}

function showForgotPasswordForm(e) {
    if (e) e.preventDefault();
    hideAllForms();
    forgotPasswordForm.classList.remove('hidden');
    document.getElementById('authTitle').textContent = 'Reset Password';
    document.getElementById('authSubtitle').textContent = 'Enter your email to reset password';
}

function showResendVerificationForm(e, email = '') {
    if (e) e.preventDefault();
    hideAllForms();
    resendVerificationForm.classList.remove('hidden');
    document.getElementById('authTitle').textContent = 'Resend Verification';
    document.getElementById('authSubtitle').textContent = 'Enter your email to resend verification';
    
    if (email) {
        document.getElementById('resendEmail').value = email;
    }
}

function showVerificationPending(email) {
    hideAllForms();
    verificationPending.classList.remove('hidden');
    document.getElementById('authTitle').textContent = 'Check Your Email';
    document.getElementById('authSubtitle').textContent = `Verification link sent to ${email}`;
}

function showAuthMessage(text, type) {
    authMessage.textContent = text;
    authMessage.className = `auth-message ${type}`;
    authMessage.style.display = 'block';
    setTimeout(() => {
        authMessage.style.display = 'none';
    }, 5000);
}

function clearForms() {
    loginForm.reset();
    registerForm.reset();
    forgotPasswordForm.reset();
    resendVerificationForm.reset();
    authMessage.style.display = 'none';
}

// File Upload Functions (with email verification check)
function handleDragOver(e) {
    e.preventDefault();
    if (!currentUser?.emailVerified) {
        return;
    }
    uploadArea.classList.add('dragover');
}

function handleDragLeave() {
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    if (!currentUser?.emailVerified) {
        showToast('Please verify your email before uploading files', 'warning');
        return;
    }
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
}

function handleFileInputChange(e) {
    if (!currentUser?.emailVerified) {
        showToast('Please verify your email before uploading files', 'warning');
        return;
    }
    
    const files = Array.from(e.target.files);
    handleFiles(files);
}

function handleKeyboardShortcuts(e) {
    if (authModal.style.display === 'flex') return;
    
    // Ctrl+U for upload (only if verified)
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        if (currentUser?.emailVerified) {
            fileInput.click();
        } else {
            showToast('Please verify your email first', 'warning');
        }
    }
    
    // F5 or Ctrl+R for refresh
    if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        loadFiles();
    }
    
    // Escape to hide message
    if (e.key === 'Escape') {
        hideMessage();
        shareModal.style.display = 'none';
    }
}

// Handle file upload - Updated for 100GB support with email verification
async function handleFiles(files) {
    if (files.length === 0) return;
    
    // Check email verification
    if (!currentUser?.emailVerified) {
        showMessage('Please verify your email address before uploading files', 'error');
        showToast('Email verification required', 'warning');
        return;
    }
    
    console.log(`📤 Handling ${files.length} files for upload`);
    
    // Validate file count
    if (files.length > 10) {
        showMessage('Maximum 10 files allowed at once', 'error');
        return;
    }
    
    // Validate file sizes - Updated to 100GB limit
    const maxSize = 100 * 1024 * 1024 * 1024; // 100GB in bytes
    const oversized = files.filter(file => file.size > maxSize);
    if (oversized.length > 0) {
        showMessage(`Files too large: ${oversized.map(f => f.name).join(', ')} (max 100GB each)`, 'error');
        return;
    }
    
    // Validate file types (client-side check)
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs'];
    const dangerousFiles = files.filter(file => {
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        return dangerousExtensions.includes(ext);
    });
    
    if (dangerousFiles.length > 0) {
        showMessage(`Dangerous file types not allowed: ${dangerousFiles.map(f => f.name).join(', ')}`, 'error');
        return;
    }

    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });

    showMessage(`Uploading ${files.length} file(s)... This may take a while for large files.`, 'info');
    progressBar.style.display = 'block';
    uploadBtn.disabled = true;
    
    try {
        const response = await uploadWithProgress(formData);
        
        progressBar.style.display = 'none';
        progress.style.width = '0%';
        uploadBtn.disabled = false;
        fileInput.value = '';
        
        if (response.ok) {
            const result = await response.json();
            showMessage(`Successfully uploaded ${result.files.length} file(s)!`, 'success');
            loadFiles();
            celebrateUpload();
            showToast('Files uploaded successfully!', 'success');
        } else {
            const error = await response.json();
            if (error.error === 'Email verification required') {
                showMessage('Please verify your email before uploading files', 'error');
                showToast('Email verification required', 'warning');
            } else {
                showMessage(`Upload failed: ${error.error}`, 'error');
            }
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        showMessage(`Upload failed: ${error.message}`, 'error');
        progressBar.style.display = 'none';
        uploadBtn.disabled = false;
    }
}

// Upload with progress tracking - Updated with longer timeout for large files
function uploadWithProgress(formData) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progress.style.width = percentComplete + '%';
                
                // Update message with progress and speed estimation
                const loaded = formatFileSize(e.loaded);
                const total = formatFileSize(e.total);
                showMessage(`Uploading... ${percentComplete.toFixed(1)}% (${loaded} / ${total})`, 'info');
                
                console.log(`📊 Upload progress: ${percentComplete.toFixed(1)}%`);
            }
        };
        
        xhr.onload = function() {
            resolve({
                ok: xhr.status >= 200 && xhr.status < 300,
                status: xhr.status,
                json: () => Promise.resolve(JSON.parse(xhr.responseText))
            });
        };
        
        xhr.onerror = function() {
            reject(new Error('Network error during upload'));
        };
        
        xhr.ontimeout = function() {
            reject(new Error('Upload timeout - file may be too large'));
        };
        
        xhr.open('POST', `${API_BASE}/upload`);
        // Extended timeout for large files - 2 hours
        xhr.timeout = 2 * 60 * 60 * 1000; 
        xhr.send(formData);
    });
}

// Load and display files
async function loadFiles() {
    console.log('📋 Loading files from server...');
    
    try {
        showLoadingState();
        
        const response = await fetch(`${API_BASE}/files`);
        const files = await response.json();
        
        if (!response.ok) {
            throw new Error(files.error || 'Failed to load files');
        }
        
        console.log(`📁 Loaded ${files.length} files`);
        displayFiles(files);
        updateStats(files);
        
    } catch (error) {
        console.error('Error loading files:', error);
        fileList.innerHTML = `<div class="no-files">❌ Error loading files: ${error.message}</div>`;
    }
}

// Show loading state
function showLoadingState() {
    fileList.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            Loading files...
        </div>
    `;
}

// Display files in the UI
function displayFiles(files) {
    if (files.length === 0) {
        fileList.innerHTML = `
            <div class="no-files">
                📂 No files uploaded yet.<br>
                <small>Upload some files to get started!</small>
            </div>
        `;
        return;
    }

    const filesHTML = files.map(file => `
        <div class="file-item" data-file-id="${file.id}">
            <div class="file-info">
                <div class="file-icon">${getFileIcon(file.type)}</div>
                <div class="file-details">
                    <h3 title="${escapeHtml(file.name)}">${truncateFilename(escapeHtml(file.name), 50)}</h3>
                    <p>
                        ${formatFileSize(file.size)} • 
                        Uploaded ${formatDate(file.upload_date)} • 
                        Downloaded ${file.download_count} time${file.download_count !== 1 ? 's' : ''}
                    </p>
                    ${file.share_link ? `<p class="share-info">📤 Shared</p>` : ''}
                </div>
            </div>
            <div class="file-actions">
                <button class="share-btn" onclick="showShareModal('${file.id}', '${escapeHtml(file.name)}')" title="Share ${escapeHtml(file.name)}">
                    🔗 Share
                </button>
                <button class="download-btn" onclick="downloadFile('${file.id}')" title="Download ${escapeHtml(file.name)}">
                    📥 Download
                </button>
                <button class="delete-btn" onclick="deleteFile('${file.id}')" title="Delete ${escapeHtml(file.name)}">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');

    fileList.innerHTML = filesHTML;
    
    // Add subtle entry animation
    const items = fileList.querySelectorAll('.file-item');
    items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        setTimeout(() => {
            item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

// Share file functionality
async function showShareModal(fileId, fileName) {
    try {
        const response = await fetch(`${API_BASE}/files/${fileId}/share`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const data = await response.json();
            shareLink.value = data.shareUrl;
            shareModal.style.display = 'flex';
            
            // Auto-select the share link
            setTimeout(() => shareLink.select(), 100);
            showToast('Share link created!', 'success');
        } else {
            const error = await response.json();
            showMessage(`Failed to create share link: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Share error:', error);
        showMessage('Failed to create share link', 'error');
    }
}

// Copy share link to clipboard
async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(shareLink.value);
        const originalText = copyShareLink.textContent;
        copyShareLink.textContent = 'Copied!';
        copyShareLink.style.background = '#48bb78';
        
        showToast('Share link copied to clipboard!', 'success');
        
        setTimeout(() => {
            copyShareLink.textContent = originalText;
            copyShareLink.style.background = '';
        }, 2000);
    } catch (error) {
        // Fallback for older browsers
        shareLink.select();
        document.execCommand('copy');
        copyShareLink.textContent = 'Copied!';
        showToast('Share link copied!', 'success');
        setTimeout(() => {
            copyShareLink.textContent = 'Copy';
        }, 2000);
    }
}

// Update statistics display
function updateStats(files) {
    const totalFilesCount = files.length;
    const totalSizeBytes = files.reduce((sum, file) => sum + file.size, 0);
    const totalDownloadsCount = files.reduce((sum, file) => sum + file.download_count, 0);
    
    // Animate counter updates
    animateCounter(totalFiles, parseInt(totalFiles.textContent) || 0, totalFilesCount);
    animateValue(totalSize, formatFileSize(totalSizeBytes));
    animateCounter(totalDownloads, parseInt(totalDownloads.textContent) || 0, totalDownloadsCount);
    
    console.log(`📊 Stats: ${totalFilesCount} files, ${formatFileSize(totalSizeBytes)}, ${totalDownloadsCount} downloads`);
}

// Animate counter changes
function animateCounter(element, start, end, duration = 1000) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// Animate value changes
function animateValue(element, newValue) {
    element.style.transition = 'transform 0.3s ease';
    element.style.transform = 'scale(1.1)';
    setTimeout(() => {
        element.textContent = newValue;
        element.style.transform = 'scale(1)';
    }, 150);
}

// Download file
async function downloadFile(fileId) {
    console.log(`📥 Downloading file: ${fileId}`);
    
    try {
        showMessage('Preparing download...', 'info');
        
        const response = await fetch(`${API_BASE}/download/${fileId}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Download failed');
        }
        
        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'download';
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="(.+)"/);
            if (match) filename = match[1];
        }
        
        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 100);
        
        showMessage(`📁 Downloaded: ${filename}`, 'success');
        showToast('File downloaded successfully!', 'success');
        
        // Refresh files to update download count
        setTimeout(loadFiles, 1000);
        
    } catch (error) {
        console.error('Download error:', error);
        showMessage(`Download failed: ${error.message}`, 'error');
    }
}

// Delete file
async function deleteFile(fileId) {
    const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
    const fileName = fileItem ? fileItem.querySelector('h3').textContent : 'this file';
    
    if (!confirm(`Are you sure you want to delete "${fileName}"?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    console.log(`🗑️ Deleting file: ${fileId}`);
    
    try {
        // Add deleting animation
        if (fileItem) {
            fileItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            fileItem.style.opacity = '0.5';
            fileItem.style.transform = 'translateX(-20px)';
        }
        
        const response = await fetch(`${API_BASE}/files/${fileId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Delete failed');
        }
        
        showMessage(`🗑️ File "${fileName}" deleted successfully!`, 'success');
        showToast('File deleted successfully!', 'success');
        loadFiles();
        
    } catch (error) {
        console.error('Delete error:', error);
        showMessage(`Delete failed: ${error.message}`, 'error');
        
        // Restore item appearance on error
        if (fileItem) {
            fileItem.style.opacity = '1';
            fileItem.style.transform = 'translateX(0)';
        }
    }
}

// Utility Functions
function getFileIcon(mimeType) {
    if (!mimeType) return '📁';
    
    const iconMap = {
        'image/': '🖼️',
        'video/': '🎥',
        'audio/': '🎵',
        'application/pdf': '📄',
        'application/msword': '📝',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
        'application/vnd.ms-excel': '📊',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
        'application/vnd.ms-powerpoint': '📊',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📊',
        'application/zip': '🗜️',
        'application/x-rar-compressed': '🗜️',
        'application/x-7z-compressed': '🗜️',
        'text/': '📄',
        'application/json': '📋',
        'application/xml': '📋',
        'application/javascript': '📜',
        'text/css': '🎨'
    };
    
    for (const [type, icon] of Object.entries(iconMap)) {
        if (mimeType.startsWith(type) || mimeType === type) {
            return icon;
        }
    }
    
    return '📁';
}

// Updated formatFileSize function to handle TB and larger sizes
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    
    return `${size} ${sizes[i]}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return `today at ${date.toLocaleTimeString()}`;
    } else if (diffDays <= 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateFilename(filename, maxLength) {
    if (filename.length <= maxLength) return filename;
    
    const extension = filename.substring(filename.lastIndexOf('.'));
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3);
    
    return truncatedName + '...' + extension;
}

function showMessage(text, type) {
    console.log(`💬 Message (${type}): ${text}`);
    
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = 'block';
    
    // Auto-hide after delay (longer for upload progress messages)
    setTimeout(() => {
        hideMessage();
    }, type === 'error' ? 10000 : (type === 'info' ? 3000 : 5000));
}

function hideMessage() {
    message.style.display = 'none';
}

function celebrateUpload() {
    // Create celebration effect
    const celebration = document.createElement('div');
    celebration.innerHTML = '🎉';
    celebration.style.position = 'fixed';
    celebration.style.top = '20px';
    celebration.style.right = '20px';
    celebration.style.fontSize = '2em';
    celebration.style.zIndex = '9999';
    celebration.style.animation = 'bounce 1s ease-in-out';
    
    document.body.appendChild(celebration);
    
    setTimeout(() => {
        document.body.removeChild(celebration);
    }, 1000);
}

// Enhanced toast notification system
function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Add appropriate icon based on type
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span class="toast-message">${icons[type]} ${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, duration);
}

// Service Worker Registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('🔧 SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('🔧 SW registration failed: ', registrationError);
            });
    });
}