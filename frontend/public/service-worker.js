/* eslint-disable no-restricted-globals */

// Cache configuration
const CACHE_NAME = 'mdrrmo-dashboard-v2';
const STATIC_CACHE = 'mdrrmo-static-v2';
const API_CACHE = 'mdrrmo-api-v2';
const MAP_CACHE = 'mdrrmo-map-v2';
const OFFLINE_QUEUE = 'mdrrmo-offline-queue';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/static/css/main.css',
  '/static/js/main.js',
  '/icon-192.png',
  '/icon-512.png',
];

// API endpoints that should be cached
const API_ENDPOINTS = [
  '/api/sheets',
  '/api/drive',
  '/api/metadata',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.error('Failed to cache static assets:', error);
        });
      }),
      // Initialize offline queue
      initializeOfflineQueue()
    ])
  );
  self.skipWaiting();
});

// Initialize IndexedDB for offline queue
async function initializeOfflineQueue() {
  try {
    const request = indexedDB.open('MDRRMODashboard', 2);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create offline queue store
      if (!db.objectStoreNames.contains('offlineQueue')) {
        const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('type', 'type', { unique: false });
      }

      // Create sync status store
      if (!db.objectStoreNames.contains('syncStatus')) {
        db.createObjectStore('syncStatus', { keyPath: 'key' });
      }
    };

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to initialize offline queue:', error);
  }
}

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (![STATIC_CACHE, API_CACHE, MAP_CACHE].includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients
      self.clients.claim(),
      // Initialize sync status
      initializeSyncStatus()
    ])
  );
});

// Initialize sync status
async function initializeSyncStatus() {
  try {
    const request = indexedDB.open('MDRRMODashboard', 2);
    return new Promise((resolve) => {
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['syncStatus'], 'readwrite');
        const store = transaction.objectStore('syncStatus');

        store.put({ key: 'lastSync', timestamp: Date.now() });
        store.put({ key: 'isOnline', value: navigator.onLine });

        resolve();
      };
      request.onerror = () => resolve();
    });
  } catch (error) {
    console.error('Failed to initialize sync status:', error);
  }
}

// Fetch event - advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests except for specific cases
  if (request.method !== 'GET' && request.method !== 'POST') {
    return;
  }

  // Handle map tile requests (OpenStreetMap and similar)
  if (isMapTileRequest(url)) {
    event.respondWith(handleMapTileRequest(request));
    return;
  }

  // Handle API requests
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Default network-first strategy
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Check if request is for map tiles
function isMapTileRequest(url) {
  return url.hostname.includes('tile.openstreetmap.org') ||
         url.hostname.includes('tile.opentopomap.org') ||
         url.pathname.match(/\.(png|jpg|jpeg|webp)$/);
}

// Check if request is for API endpoints
function isApiRequest(url) {
  return url.pathname.startsWith('/api/') ||
         API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint));
}

// Check if request is for static assets
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/) ||
         request.destination === 'style' ||
         request.destination === 'script' ||
         request.destination === 'image' ||
         request.destination === 'font';
}

// Handle map tile requests with cache-first strategy
async function handleMapTileRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Fetch from network
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(MAP_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Return offline placeholder for map tiles
    return createOfflineTileResponse();
  }
}

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);

    // Cache successful GET responses
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Try cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Queue failed requests for later retry
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
      await queueFailedRequest(request);
    }

    // Return offline response
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'Request queued for sync when online'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return basic offline page for HTML requests
    if (request.destination === 'document') {
      const offlineResponse = await caches.match('/');
      return offlineResponse || createOfflinePageResponse();
    }
  }
}

// Create offline tile placeholder
function createOfflineTileResponse() {
  const canvas = new OffscreenCanvas(256, 256);
  const ctx = canvas.getContext('2d');

  // Create a gray placeholder with "Offline" text
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Offline', 128, 128);

  return new Response(canvas.convertToBlob(), {
    headers: { 'Content-Type': 'image/png' }
  });
}

// Create offline page response
function createOfflinePageResponse() {
  const offlineHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Offline - MDRRMO Dashboard</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
      <h1>You're Offline</h1>
      <p>The application is currently offline. Some features may not be available.</p>
      <p>Please check your internet connection and try again.</p>
      <button onclick="window.location.reload()">Retry</button>
    </body>
    </html>
  `;

  return new Response(offlineHtml, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Queue failed requests for background sync
async function queueFailedRequest(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' ? await request.clone().text() : null,
      timestamp: Date.now(),
      type: 'api-request'
    };

    const dbRequest = indexedDB.open('MDRRMODashboard', 2);
    return new Promise((resolve) => {
      dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['offlineQueue'], 'readwrite');
        const store = transaction.objectStore('offlineQueue');

        store.add(requestData);
        resolve();
      };
      dbRequest.onerror = () => resolve();
    });
  } catch (error) {
    console.error('Failed to queue request:', error);
  }
}

// Background sync for offline queue processing
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(processOfflineQueue());
  } else if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  } else if (event.tag === 'sync-map-data') {
    event.waitUntil(syncMapData());
  }
});

// Process offline queue
async function processOfflineQueue() {
  console.log('Processing offline queue');

  try {
    const dbRequest = indexedDB.open('MDRRMODashboard', 2);
    const db = await new Promise((resolve, reject) => {
      dbRequest.onsuccess = (event) => resolve(event.target.result);
      dbRequest.onerror = () => reject(dbRequest.error);
    });

    const transaction = db.transaction(['offlineQueue'], 'readwrite');
    const store = transaction.objectStore('offlineQueue');
    const index = store.index('timestamp');

    const requests = await new Promise((resolve) => {
      const results = [];
      index.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
    });

    console.log(`Processing ${requests.length} queued requests`);

    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });

        if (response.ok) {
          // Remove from queue on success
          await new Promise((resolve) => {
            const deleteRequest = store.delete(requestData.id);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => resolve();
          });
          console.log('Successfully synced request:', requestData.url);
        }
      } catch (error) {
        console.error('Failed to sync request:', requestData.url, error);
      }
    }

    // Update sync status
    const syncTransaction = db.transaction(['syncStatus'], 'readwrite');
    const syncStore = syncTransaction.objectStore('syncStatus');
    syncStore.put({ key: 'lastSync', timestamp: Date.now() });

  } catch (error) {
    console.error('Failed to process offline queue:', error);
  }
}

// Sync application data
async function syncData() {
  try {
    console.log('Syncing application data');

    const response = await fetch('/api/sync/all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('Data synced successfully');
      // Notify clients
      notifyClients({ type: 'SYNC_COMPLETE', success: true });
    } else {
      console.error('Data sync failed:', response.status);
      notifyClients({ type: 'SYNC_COMPLETE', success: false });
    }
  } catch (error) {
    console.error('Sync failed:', error);
    notifyClients({ type: 'SYNC_COMPLETE', success: false, error: error.message });
  }
}

// Sync map-related data
async function syncMapData() {
  try {
    console.log('Syncing map data');

    // Sync any pending map operations
    const response = await fetch('/api/map/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('Map data synced successfully');
    }
  } catch (error) {
    console.error('Map sync failed:', error);
  }
}

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (!event.data) return;

  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_SYNC_STATUS':
      getSyncStatus().then(status => {
        event.ports[0].postMessage({ type: 'SYNC_STATUS', status });
      });
      break;

    case 'TRIGGER_SYNC':
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        self.registration.sync.register('sync-offline-queue');
      }
      break;

    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      });
      break;

    default:
      console.log('Unknown message type:', type);
  }
});

// Get current sync status
async function getSyncStatus() {
  try {
    const dbRequest = indexedDB.open('MDRRMODashboard', 2);
    const db = await new Promise((resolve, reject) => {
      dbRequest.onsuccess = (event) => resolve(event.target.result);
      dbRequest.onerror = () => reject(dbRequest.error);
    });

    const transaction = db.transaction(['syncStatus', 'offlineQueue'], 'readonly');
    const syncStore = transaction.objectStore('syncStatus');
    const queueStore = transaction.objectStore('offlineQueue');

    const [lastSync, queueCount] = await Promise.all([
      new Promise(resolve => {
        const request = syncStore.get('lastSync');
        request.onsuccess = () => resolve(request.result?.timestamp || null);
        request.onerror = () => resolve(null);
      }),
      new Promise(resolve => {
        const request = queueStore.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      })
    ]);

    return {
      lastSync,
      queueCount,
      isOnline: navigator.onLine
    };
  } catch (error) {
    console.error('Failed to get sync status:', error);
    return { lastSync: null, queueCount: 0, isOnline: navigator.onLine };
  }
}

// Clear all caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('All caches cleared');
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
}

// Notify all clients
async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}

// Handle online/offline status changes
self.addEventListener('online', () => {
  console.log('Service Worker: Online');
  notifyClients({ type: 'ONLINE_STATUS', online: true });

  // Trigger sync when coming online
  self.registration.sync.register('sync-offline-queue');
});

self.addEventListener('offline', () => {
  console.log('Service Worker: Offline');
  notifyClients({ type: 'ONLINE_STATUS', online: false });
});
