// Service Worker — LeyFácil.pro
const CACHE_NAME = 'leyfacil-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/tokens.css',
  '/css/reset.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/analyzer.css',
  '/css/result.css',
  '/css/history.css',
  '/js/app.js',
  '/js/i18n.js',
  '/js/analyzer.js',
  '/js/groq.js',
  '/js/pdf-reader.js',
  '/js/url-reader.js',
  '/js/result.js',
  '/js/export.js',
  '/js/share.js',
  '/js/history.js',
  '/manifest.json',
  '/icons/favicon.svg'
]

// Install — cache estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate — limpiar caches viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — network first para API, cache first para estáticos
self.addEventListener('fetch', (event) => {
  const { request } = event

  // No interceptar llamadas a la API — dejar que el navegador las maneje
  if (request.url.includes('api.leyfacil.pro') || request.url.includes('workers.dev')) {
    return
  }

  // Cache first para estáticos
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        // Cachear nuevos recursos estáticos
        if (response.ok && request.method === 'GET') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
    }).catch(() => {
      // Offline fallback
      if (request.destination === 'document') {
        return caches.match('/index.html')
      }
    })
  )
})
