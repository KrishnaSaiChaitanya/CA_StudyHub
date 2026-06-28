const CACHE_NAME = 'ca-studyhub-v1';
const OFFLINE_URL = '/offline';

const ASSETS_TO_CACHE = [
  '/',
  '/offline',
  '/manifest.json',
  '/Logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

// Helper to determine if request is a static asset
function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/static/') ||
    pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|otf|json)$/)
  );
}

// 1. Install event: pre-cache pages and standard icons
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline fallback and core assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch event: intercept network requests
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Determine if it is a request within our application origin or Supabase REST queries
  const isAppOrigin = event.request.url.startsWith(self.location.origin);
  const isSupabaseRest = url.hostname.endsWith('supabase.co') && url.pathname.startsWith('/rest/v1/');

  if (!isAppOrigin && !isSupabaseRest) {
    return;
  }

  // Exclude dynamic authentication routes or local API logic
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/auth') ||
    (url.hostname.endsWith('supabase.co') && !url.pathname.startsWith('/rest/v1/'))
  ) {
    return;
  }

  // Choose caching strategy:
  // - Static assets (JS/CSS/Images/etc.) -> Cache-First
  // - Pages and Supabase API GET requests -> Network-First (so they get updated data first, offline fallback if disconnected)
  event.respondWith(
    isStaticAsset(url.pathname)
      ? cacheFirst(event.request)
      : networkFirst(event.request)
  );
});

// Cache-First strategy for static assets
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    // Cache static assets that succeed
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Network error on static asset', { status: 480, statusText: 'Network Error' });
  }
}

// Network-First strategy for pages/routes and API requests
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    // Cache successful GET responses
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // If request fails (offline), load from cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache and it is a document navigation request, return offline fallback page
    if (request.mode === 'navigate') {
      const offlineResponse = await cache.match(OFFLINE_URL);
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // If it is an API call, return a custom offline response
    return new Response(
      JSON.stringify({ error: 'You are currently offline. Cached data is not available for this request.' }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
