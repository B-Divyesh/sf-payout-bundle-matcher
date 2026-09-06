import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const base = 'https://payout-bundle-matcher.sociobot.in'
const browser = await chromium.launch()
const findings = {}

async function inspect(viewport, name) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  const errors = []
  const requests = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(String(error)))
  page.on('request', (request) => requests.push(request.url()))
  const response = await page.goto(base, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const landing = await page.evaluate(() => {
    const visible = (element) => {
      if (!element) return false
      const box = element.getBoundingClientRect()
      return box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth
    }
    const interactive = [...document.querySelectorAll('a,button,input,select,textarea')]
      .filter((element) => {
        const box = element.getBoundingClientRect()
        return box.width > 0 && box.height > 0
      })
      .map((element) => {
        const box = element.getBoundingClientRect()
        return { label: (element.innerText || element.getAttribute('aria-label') || element.getAttribute('name') || '').trim(), tag: element.tagName, width: Math.round(box.width), height: Math.round(box.height) }
      })
    return {
      title: document.title,
      h1: [...document.querySelectorAll('h1')].map((element) => element.textContent.trim()),
      h2: [...document.querySelectorAll('h2')].map((element) => element.textContent.trim()),
      firstParagraph: document.querySelector('.lede')?.textContent.trim(),
      primary: document.querySelector('.hero-actions .primary')?.textContent.trim(),
      primaryFullyVisible: visible(document.querySelector('.hero-actions .primary')),
      scrollY,
      canonical: document.querySelector('link[rel="canonical"]')?.href || null,
      openGraph: document.querySelectorAll('meta[property^="og:"]').length,
      twitter: document.querySelectorAll('meta[name^="twitter:"]').length,
      appleTouch: document.querySelector('link[rel="apple-touch-icon"]')?.href || null,
      nav: [...document.querySelectorAll('header nav a,header nav button')].map((element) => element.textContent.trim()),
      interactive,
      documentOverflow: document.documentElement.scrollWidth > innerWidth
    }
  })
  const axe = await new AxeBuilder({ page }).analyze()
  await page.screenshot({ path: `/work/.evidence/live-review/${name}-fresh.png`, fullPage: false })
  await context.close()
  return { status: response.status(), landing, axe: axe.violations.map((v) => ({ id: v.id, impact: v.impact })), errors, crossOrigin: requests.filter((url) => new URL(url).origin !== new URL(base).origin) }
}

findings.desktop = await inspect({ width: 1366, height: 900 }, 'desktop')
findings.phone = await inspect({ width: 390, height: 844 }, 'phone')

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true })
  const page = await context.newPage()
  const response = await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  findings.demoFresh = await page.evaluate(() => ({
    statusText: document.body.innerText.includes('Demo — sample data, nothing is saved'),
    title: document.title,
    h1: document.querySelector('h1')?.textContent.trim(),
    reset: [...document.querySelectorAll('button,a')].some((element) => /reset demo/i.test(element.textContent)),
    startReal: [...document.querySelectorAll('button,a')].some((element) => /start for real/i.test(element.textContent)),
    loadedRows: document.querySelectorAll('.transactions tbody tr').length,
    fileSummary: [...document.querySelectorAll('.file-drop strong')].map((element) => element.textContent.trim()),
    bodyHasTrySample: /try it with sample data/i.test(document.body.innerText)
  }))
  findings.demoFresh.httpStatus = response.status()
  await page.goto(base, { waitUntil: 'networkidle' })
  const firstDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download sample CSVs' }).click()
  const download1 = await firstDownload
  const secondDownload = await page.waitForEvent('download')
  findings.sampleDownload = { first: download1.suggestedFilename(), second: secondDownload.suggestedFilename(), loadedRows: await page.locator('.transactions tbody tr').count() }
  await context.close()
}

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.locator('#payout-file').setInputFiles({ name: 'payout.csv', mimeType: 'text/csv', buffer: Buffer.from('payout_id,payout_date,net_amount\nREAL-77,2026-08-26,285.50\n') })
  await page.locator('#sales-file').setInputFiles({ name: 'sales.csv', mimeType: 'text/csv', buffer: Buffer.from('order_id,paid_date,gross_amount,processor_fee,refund_amount,status\nREAL-A,2026-08-25,120,3.60,0,paid\nREAL-B,2026-08-26,200,5.90,25,partially_refunded\n') })
  await page.getByRole('button', { name: /Confirm files/ }).click()
  await page.locator('#mapping-form input[type=checkbox]').check()
  await page.getByRole('button', { name: /Use this mapping/ }).click()
  await page.locator('.variance dd').filter({ hasText: '$0.00' }).waitFor()
  await page.goto(`${base}/demo`, { waitUntil: 'networkidle' })
  await page.locator('.variance dd').filter({ hasText: '$0.00' }).waitFor()
  findings.demoIsolation = await page.evaluate(() => ({
    realReferenceVisible: document.body.innerText.includes('REAL-77') && document.body.innerText.includes('REAL-A'),
    sampleBannerVisible: document.body.innerText.includes('Demo — sample data, nothing is saved'),
    resetVisible: /reset demo/i.test(document.body.innerText),
    variance: [...document.querySelectorAll('.variance dd')].map((element) => element.textContent.trim())
  }))
  await page.screenshot({ path: '/work/.evidence/live-review/demo-reads-real-workspace.png', fullPage: true })
  await context.close()
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  const routes = []
  for (const path of ['/', '/demo', '/privacy/', '/terms/', '/missing-review-route']) {
    const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
    routes.push(await page.evaluate(({ path, status }) => ({
      path,
      status,
      title: document.title,
      h1: [...document.querySelectorAll('h1')].map((element) => element.textContent.trim()),
      header: !!document.querySelector('header'),
      nav: !!document.querySelector('nav'),
      main: !!document.querySelector('main'),
      footer: !!document.querySelector('footer'),
      skip: !!document.querySelector('.skip-link'),
      canonical: document.querySelector('link[rel="canonical"]')?.href || null,
      description: document.querySelector('meta[name="description"]')?.content || null
    }), { path, status: response.status() }))
  }
  findings.routes = routes
  await context.close()
}

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  const responses = []
  for (const path of ['/robots.txt', '/sitemap.xml', '/manifest.webmanifest', '/privacy/', '/terms/', '/offline.html']) {
    const response = await page.request.get(`${base}${path}`)
    responses.push({ path, status: response.status(), type: response.headers()['content-type'], cache: response.headers()['cache-control'] || null })
  }
  const sitemap = await (await page.request.get(`${base}/sitemap.xml`)).text()
  findings.resources = responses
  findings.sitemapHasDemo = sitemap.includes('/demo')
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.keyboard.press('Tab')
  findings.keyboard = await page.evaluate(() => ({ activeText: document.activeElement?.textContent.trim(), outline: getComputedStyle(document.activeElement).outlineWidth }))
  await page.keyboard.press('Enter')
  findings.keyboard.afterEnter = await page.evaluate(() => ({ hash: location.hash, activeId: document.activeElement?.id || null }))
  await page.getByRole('button', { name: 'Get Pro' }).click()
  findings.dialog = await page.evaluate(() => ({ open: document.querySelector('dialog')?.open, activeLabel: document.activeElement?.getAttribute('aria-label'), checkout: document.querySelector('dialog a.button')?.href }))
  await page.keyboard.press('Escape')
  findings.dialog.afterEscapeFocus = await page.evaluate(() => document.activeElement?.textContent.trim())
  await context.close()
}

console.log(JSON.stringify(findings, null, 2))
await browser.close()
