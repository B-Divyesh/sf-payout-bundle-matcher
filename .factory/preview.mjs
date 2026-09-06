import { createServer } from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const root = new URL('../dist/', import.meta.url).pathname
const port = Number(process.env.PORT || 4173)
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8'
}
const headers = {
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://api.sociobot.in; font-src 'self'; manifest-src 'self'; worker-src 'self'; form-action 'self'; frame-ancestors 'none'",
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
}

function resolveRequest(pathname) {
  if (pathname === '/') return { file: 'index.html', status: 200 }
  if (pathname === '/demo' || pathname === '/demo/') return { file: 'index.html', status: 200 }
  if (pathname === '/privacy' || pathname === '/privacy/') return { file: 'privacy/index.html', status: 200 }
  if (pathname === '/terms' || pathname === '/terms/') return { file: 'terms/index.html', status: 200 }
  const relative = pathname.replace(/^\/+/, '')
  const candidate = normalize(join(root, relative))
  if (candidate.startsWith(root) && statSync(candidate, { throwIfNoEntry: false })?.isFile()) return { file: relative, status: 200 }
  return { file: '404.html', status: 404 }
}

createServer((request, response) => {
  const pathname = new URL(request.url || '/', 'http://localhost').pathname
  const resolved = resolveRequest(pathname)
  const filename = normalize(join(root, resolved.file))
  const cache = resolved.file === 'sw.js'
    ? 'no-cache, no-store, must-revalidate'
    : resolved.file.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'no-cache'
  response.writeHead(resolved.status, { ...headers, 'Cache-Control': cache, 'Content-Type': mime[extname(filename)] || 'application/octet-stream' })
  response.end(readFileSync(filename))
}).listen(port, '127.0.0.1', () => process.stdout.write(`Factory preview: http://127.0.0.1:${port}\n`))
