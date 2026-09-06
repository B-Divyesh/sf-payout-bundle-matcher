const VERSION = 'settlement-match-v5'
const SHELL = `${VERSION}-shell`
const RUNTIME = `${VERSION}-runtime`
const CORE = ['/', '/demo', '/privacy/', '/terms/', '/404.html', '/offline.html', '/legal.css', '/manifest.webmanifest', '/settlement-landscape.webp', '/icons/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png']

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL)
    await cache.addAll(CORE)
    const html = await (await cache.match('/')).text()
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1])
    await cache.addAll(assets)
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => ![SHELL, RUNTIME].includes(key)).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      if (!self.navigator.onLine) {
        const cached = await caches.match(request, { ignoreSearch: true })
        return cached || (await caches.match('/offline.html'))
      }
      try {
        const response = await Promise.race([
          fetch(request),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Navigation timed out')), 2000))
        ])
        const cache = await caches.open(RUNTIME)
        if (response.ok) cache.put(request, response.clone())
        return response
      } catch {
        const cached = await caches.match(request, { ignoreSearch: true })
        if (cached) return cached
        if (url.pathname === '/') return (await caches.match('/')) || (await caches.match('/offline.html'))
        return (await caches.match('/offline.html'))
      }
    })())
    return
  }

  event.respondWith((async () => {
    const cached = await caches.match(request)
    if (cached) return cached
    try {
      const response = await fetch(request)
      if (response.ok) (await caches.open(RUNTIME)).put(request, response.clone())
      return response
    } catch {
      return new Response('', { status: 504, statusText: 'Offline' })
    }
  })())
})
