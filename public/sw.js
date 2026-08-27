const VERSION = 'settlement-match-v2'
const SHELL = `${VERSION}-shell`
const RUNTIME = `${VERSION}-runtime`
const CORE = ['/', '/offline.html', '/manifest.webmanifest', '/settlement-landscape.webp', '/icons/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png']

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
      try {
        const response = await fetch(request)
        const cache = await caches.open(RUNTIME)
        cache.put(request, response.clone())
        return response
      } catch {
        return (await caches.match(request)) || (await caches.match('/')) || (await caches.match('/offline.html'))
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
