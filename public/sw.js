// Quest Island Service Worker with Advanced Caching
const CACHE_NAME = 'quest-island-v1';
const CORE_CACHE = 'quest-island-core-v1';
const ASSETS_CACHE = 'quest-island-assets-v1';
const EXTERNAL_CACHE = 'quest-island-external-v1';

const MAX_ASSET_ENTRIES = 50;
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days
const NETWORK_TIMEOUT = 3000; // 3 seconds

// Core app resources to cache on install
const coreUrls = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html'
];

// Install event - cache core resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then(cache => {
        console.log('Caching core resources');
        return cache.addAll(coreUrls);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (![CORE_CACHE, ASSETS_CACHE, EXTERNAL_CACHE].includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event with advanced caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Core app resources - CacheFirst strategy
  if (isCoreAppRequest(url)) {
    event.respondWith(cacheFirst(request, CORE_CACHE));
    return;
  }

  // Biome/pin images and assets - StaleWhileRevalidate strategy
  // This includes prefetched assets from link[rel="prefetch"]
  if (isAssetRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, ASSETS_CACHE));
    return;
  }

  // External lesson URLs - NetworkFirst with fallback
  if (isExternalRequest(url)) {
    event.respondWith(networkFirstWithFallback(request, EXTERNAL_CACHE));
    return;
  }

  // Navigation requests - serve offline.html if network fails
  if (request.mode === 'navigate' && !isDevToolsRequest(url)) {
    event.respondWith(navigateWithFallback(request));
    return;
  }

  // Default: try network first, fallback to cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Cache strategies implementation

// CacheFirst: for hashed static assets
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('Cache first failed:', error);
    throw error;
  }
}

// StaleWhileRevalidate: for biome images and assets
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch in background to update cache
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
      // Notify client of new asset cached
      notifyClientsOfNewAsset(request.url);
      // Clean up old entries
      cleanupAssetCache(cache);
    }
    return response;
  }).catch(() => null);

  // Return cached version immediately if available
  if (cached) {
    return cached;
  }

  // If no cached version, wait for network
  return fetchPromise || new Response('Asset not available offline', { status: 503 });
}

// NetworkFirst: for external content with timeout
async function networkFirstWithFallback(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), NETWORK_TIMEOUT)
      )
    ]);

    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('Network first failed, trying cache:', error);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }

    // Return offline fallback for external content
    return new Response('Content not available offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Navigation with offline fallback
async function navigateWithFallback(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('Navigation failed, serving offline page');
    return caches.match('/offline.html');
  }
}

// Helper functions

function isCoreAppRequest(url) {
  return url.origin === self.location.origin && (
    url.pathname === '/' ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest'
  );
}

function isAssetRequest(url) {
  return url.origin === self.location.origin && (
    url.pathname.includes('/src/assets/') ||
    url.pathname.includes('/biomes/') ||
    url.pathname.includes('/generated_images/') ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)
  );
}

function isExternalRequest(url) {
  return url.origin !== self.location.origin && 
         (url.protocol === 'http:' || url.protocol === 'https:');
}

function isDevToolsRequest(url) {
  return url.pathname.startsWith('/tools/');
}

// Asset cache cleanup
async function cleanupAssetCache(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_ASSET_ENTRIES) {
    // Remove oldest entries
    const entriesToDelete = keys.length - MAX_ASSET_ENTRIES;
    for (let i = 0; i < entriesToDelete; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// Message channel for client notifications
function notifyClientsOfNewAsset(assetUrl) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'ASSET_CACHED',
        url: assetUrl,
        timestamp: Date.now()
      });
    });
  });
}

// Handle messages from client
self.addEventListener('message', event => {
  const { data } = event;
  
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (data.type === 'GET_CACHE_STATUS') {
    getCacheStatus().then(status => {
      event.ports[0].postMessage(status);
    });
  }
});

// Get cache status for debugging
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = keys.length;
  }
  
  return status;
}