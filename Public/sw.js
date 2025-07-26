const CACHE_NAME = 'file-manager-pro-v2-100gb';
const urlsToCache = [
    '/',
    '/style.css',
    '/script.js',
    '/api/health'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    console.log('📦 Service Worker installing (100GB support)...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('📦 Cache installation failed:', error);
            })
    );
    // Force activation of new service worker
    self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    console.log('🔧 Service Worker activating (100GB support)...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Take control of all pages immediately
    return self.clients.claim();
});

// Enhanced Fetch Event - Network First Strategy for API calls, Cache First for static assets
// Special handling for large file uploads and downloads
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Special handling for large file operations - don't intercept these
    if (url.pathname.includes('/upload') || 
        url.pathname.includes('/download') || 
        url.pathname.includes('/share/')) {
        
        // Let large file requests pass through directly without service worker interference
        console.log('🔥 Large file operation detected, bypassing service worker:', url.pathname);
        return; // Don't call event.respondWith for large file operations
    }
    
    // Handle API requests with Network First strategy
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Don't cache auth-related requests
                    if (url.pathname.includes('/auth/')) {
                        return response;
                    }
                    
                    // Cache other API responses (like file lists) but with shorter TTL for large files
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            // Add cache headers for better large file handling
                            const cachedResponse = new Response(responseClone.body, {
                                status: responseClone.status,
                                statusText: responseClone.statusText,
                                headers: {
                                    ...responseClone.headers,
                                    'Cache-Control': 'max-age=300' // 5 minutes cache for file lists
                                }
                            });
                            cache.put(event.request, cachedResponse);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Return cached version if network fails
                    return caches.match(event.request);
                })
        );
        return;
    }
    
    // Handle static assets with Cache First strategy
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }
                
                // Otherwise fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Cache the response
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                        
                        return response;
                    });
            })
    );
});

// Enhanced background sync for large file operations
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync-uploads') {
        console.log('🔄 Background sync triggered for large file uploads');
        event.waitUntil(processOfflineUploads());
    }
    
    if (event.tag === 'large-file-cleanup') {
        console.log('🧹 Background cleanup for large file cache');
        event.waitUntil(cleanupLargeFileCache());
    }
});

// Process uploads that were queued while offline
async function processOfflineUploads() {
    try {
        console.log('🔄 Processing offline uploads...');
        
        // For large files, we might want to implement a queue system
        // This would handle queued uploads from IndexedDB
        // Implementation depends on your offline storage strategy
        
        // Send message to main thread about sync completion
        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                client.postMessage({
                    type: 'BACKGROUND_SYNC_COMPLETE',
                    data: { uploadsProcessed: 0 }
                });
            });
        });
    } catch (error) {
        console.error('❌ Background sync failed:', error);
    }
}

// Cleanup large file cache to prevent storage overflow
async function cleanupLargeFileCache() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const requests = await cache.keys();
        
        // Remove old cached responses to free up space
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes for large file contexts
        
        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const cachedTime = response.headers.get('sw-cached-time');
                if (cachedTime && (now - parseInt(cachedTime)) > maxAge) {
                    await cache.delete(request);
                    console.log('🗑️ Cleaned up old cache entry:', request.url);
                }
            }
        }
    } catch (error) {
        console.error('❌ Cache cleanup failed:', error);
    }
}

// Enhanced push notifications for large file operations
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        
        let title = data.title || 'File Manager Pro';
        let body = data.body || 'File operation completed';
        
        // Special handling for large file notifications
        if (data.type === 'large-file-upload') {
            title = '🔥 Large File Upload Complete';
            body = `Successfully uploaded ${data.fileName} (${data.fileSize})`;
        } else if (data.type === 'large-file-download') {
            title = '📥 Large File Download Ready';
            body = `${data.fileName} is ready for download`;
        }
        
        const options = {
            body: body,
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey || 1,
                type: data.type,
                fileName: data.fileName,
                fileSize: data.fileSize
            },
            actions: [
                {
                    action: 'view',
                    title: 'View Files',
                    icon: '/icon-explore.png'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss',
                    icon: '/icon-close.png'
                }
            ],
            requireInteraction: data.type === 'large-file-upload' // Keep large file notifications visible
        };
        
        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    }
});

// Handle notification clicks with large file context
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const data = event.notification.data;
    
    if (event.action === 'view') {
        // Open the app to the files section
        event.waitUntil(
            clients.openWindow('/#files')
        );
    } else if (event.action === 'dismiss') {
        // Just close the notification
        return;
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
    
    // Log large file notification interactions
    if (data && data.type && data.type.includes('large-file')) {
        console.log(`📊 Large file notification interaction: ${data.type} - ${data.fileName}`);
    }
});

// Enhanced message handling for large file operations
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_REFRESH') {
        // Force refresh of specific cache entries
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.delete(event.data.url);
            })
        );
    }
    
    // Handle large file upload progress updates
    if (event.data && event.data.type === 'LARGE_FILE_UPLOAD_PROGRESS') {
        const { fileName, progress, fileSize } = event.data;
        console.log(`📊 Large file upload progress: ${fileName} - ${progress}% (${fileSize})`);
        
        // Could store progress in IndexedDB for persistence
        // or send updates to other tabs
        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                if (client.id !== event.source.id) {
                    client.postMessage({
                        type: 'UPLOAD_PROGRESS_UPDATE',
                        data: { fileName, progress, fileSize }
                    });
                }
            });
        });
    }
    
    // Handle large file upload completion
    if (event.data && event.data.type === 'LARGE_FILE_UPLOAD_COMPLETE') {
        const { fileName, fileSize } = event.data;
        console.log(`✅ Large file upload completed: ${fileName} (${fileSize})`);
        
        // Trigger cache cleanup after large file upload
        self.registration.sync.register('large-file-cleanup');
        
        // Show notification for completed large file upload
        self.registration.showNotification('🔥 Large File Upload Complete', {
            body: `Successfully uploaded ${fileName} (${fileSize})`,
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            tag: 'large-file-upload',
            requireInteraction: true
        });
    }
});

// Storage quota management for large files
self.addEventListener('quotachange', (event) => {
    console.log('📊 Storage quota changed - managing space for large files');
    
    // Clean up cache to make room for large files
    event.waitUntil(cleanupLargeFileCache());
});

// Enhanced error handling for large file operations
self.addEventListener('error', (event) => {
    console.error('❌ Service Worker error:', event.error);
    
    // Special handling for large file related errors
    if (event.error && event.error.message) {
        if (event.error.message.includes('storage') || 
            event.error.message.includes('quota') ||
            event.error.message.includes('space')) {
            
            console.log('💾 Storage related error detected - cleaning up cache');
            cleanupLargeFileCache();
            
            // Notify user about storage issues
            self.registration.showNotification('Storage Warning', {
                body: 'Running low on storage space. Some files may not be cached.',
                icon: '/icon-192.png',
                badge: '/badge-72.png',
                tag: 'storage-warning'
            });
        }
    }
});

// Performance monitoring for large file operations
self.addEventListener('activate', (event) => {
    // Monitor performance metrics for large file handling
    if ('performance' in self && 'mark' in self.performance) {
        self.performance.mark('sw-activated-100gb');
    }
});

console.log('🔥 Service Worker loaded with 100GB file support!');
console.log('💡 Features:');
console.log('   • Large file upload/download bypass');
console.log('   • Enhanced caching for file metadata');  
console.log('   • Storage quota management');
console.log('   • Background sync for large operations');
console.log('   • Progressive notifications');