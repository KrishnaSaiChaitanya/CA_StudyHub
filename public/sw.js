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
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[Service Worker] Pre-caching offline fallback and core assets');
      
      const cachePromises = ASSETS_TO_CACHE.map(async (url) => {
        try {
          const response = await fetch(url, { redirect: 'follow' });
          if (response.ok) {
            return cache.put(url, response);
          }
          console.warn(`[Service Worker] Failed to pre-cache ${url}: Status ${response.status}`);
        } catch (error) {
          console.error(`[Service Worker] Failed to fetch and cache ${url}:`, error);
        }
      });
      
      await Promise.all(cachePromises);
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
      
      // If the offline page is not in cache, return a friendly generic HTML response instead of JSON
      return new Response(
        `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Offline - CA StudyHub</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; text-align: center; padding: 50px; background: #f9fafb; color: #374151; }
            h1 { font-size: 24px; margin-bottom: 10px; }
            p { font-size: 16px; color: #6b7280; }
            .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #0284c7; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
          </style>
        </head>
        <body>
          <h1>You are offline</h1>
          <p>Please check your internet connection and try again.</p>
          <a href="/" class="btn">Retry</a>
        </body>
        </html>`,
        {
          status: 503,
          headers: { 'Content-Type': 'text/html' }
        }
      );
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
