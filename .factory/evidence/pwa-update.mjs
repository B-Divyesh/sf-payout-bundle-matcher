import { createServer } from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { chromium } from 'playwright'

const dist = new URL('../../dist/', import.meta.url).pathname
let workerVersion = 'update-a'
const mime = {
  '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.webp': 'image/webp'
}

const server = createServer((request, response) => {
  const pathname = new URL(request.url || '/', 'http://localhost').pathname
  const routeFiles = { '/': 'index.html', '/demo': 'index.html', '/demo/': 'index.html', '/privacy/': 'privacy/index.html', '/terms/': 'terms/index.html' }
  const relative = routeFiles[pathname] || pathname.replace(/^\/+/, '')
  const filename = normalize(join(dist, relative))
  if (!filename.startsWith(dist) || !statSync(filename, { throwIfNoEntry: false })?.isFile()) {
    response.writeHead(404).end()
    return
  }
  const body = relative === 'sw.js'
    ? readFileSync(filename, 'utf8').replaceAll('settlement-match-v5', `settlement-match-${workerVersion}`)
    : readFileSync(filename)
  response.writeHead(200, {
    'Content-Type': mime[extname(filename)] || 'application/octet-stream',
    'Cache-Control': relative === 'sw.js' ? 'no-cache, no-store, must-revalidate' : 'no-cache'
  }).end(body)
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
if (!address || typeof address === 'string') throw new Error('Could not start local PWA update server.')
const baseUrl = `http://127.0.0.1:${address.port}`
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' })
const context = await browser.newContext()
const page = await context.newPage()

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))

  workerVersion = 'update-b'
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update())
  await page.getByRole('status').filter({ hasText: 'A new version is ready.' }).waitFor()
  const navigation = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5_000 })
  await page.getByRole('button', { name: 'Update now' }).click()
  await navigation
  await page.waitForFunction(async () => (await caches.keys()).includes('settlement-match-update-b-shell'))

  const result = await page.evaluate(async () => ({
    controller: Boolean(navigator.serviceWorker.controller),
    caches: await caches.keys()
  }))
  if (!result.controller || !result.caches.includes('settlement-match-update-b-shell')) throw new Error(`Waiting update did not activate: ${JSON.stringify(result)}`)
  console.log(JSON.stringify({ updateActivated: true, cache: 'settlement-match-update-b-shell' }))
} finally {
  await context.close()
  await browser.close()
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
}
