import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('phone first screen states the job, audience, action, and three facts', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Match a payout to your sales' })).toBeVisible()
  await expect(page.getByText('For one-store owners and bookkeepers')).toBeVisible()
  await expect(page.locator('.hero').getByRole('link', { name: 'Try it with sample data' })).toBeVisible()
  await expect(page.locator('.hero-facts li')).toHaveCount(3)
  const firstAction = await page.locator('.hero').getByRole('link', { name: 'Try it with sample data' }).boundingBox()
  expect(firstAction && firstAction.y + firstAction.height).toBeLessThanOrEqual(844)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
})

test('routes have distinct titles, shared structure, metadata, and a real 404', async ({ page, request }) => {
  const routes = [
    ['/', 'Settlement Match — match a payout to sales'],
    ['/demo', 'Demo — Settlement Match'],
    ['/privacy/', 'Privacy — Settlement Match'],
    ['/terms/', 'Terms — Settlement Match']
  ] as const
  for (const [path, title] of routes) {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle(title)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('main')).toHaveCount(1)
    await expect(page.locator('header')).toHaveCount(1)
    await expect(page.locator('footer')).toHaveCount(1)
    await expect(page.locator('meta[name=description]')).toHaveAttribute('content', /.+/)
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', /^https:\/\/payout-bundle-matcher\.sociobot\.in\//)
  }
  await page.goto('/')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /social-preview\.png$/)
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/icons/apple-touch-icon.png')
  const missing = await page.goto('/missing-review-route')
  expect(missing?.status()).toBe(404)
  await expect(page).toHaveTitle('Page not found — Settlement Match')
  await expect(page.getByRole('heading', { level: 1, name: 'This page does not exist' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Return to the matcher' })).toBeVisible()
  expect((await request.get('/sitemap.xml')).status()).toBe(200)
  expect(await (await request.get('/sitemap.xml')).text()).toContain('/demo')
})

test('home, demo, legal, and 404 pages have no serious accessibility issues', async ({ page }) => {
  for (const path of ['/', '/demo', '/privacy/', '/terms/', '/missing-review-route']) {
    await page.goto(path)
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact || '')), path).toEqual([])
  }
})

test('every internal page link has a working destination', async ({ page, request, baseURL }) => {
  const paths = ['/', '/demo', '/privacy/', '/terms/', '/missing-review-route']
  const internal = new Set<string>()
  for (const path of paths) {
    await page.goto(path)
    for (const href of await page.locator('a[href]').evaluateAll(links => links.map(link => link.getAttribute('href') || ''))) {
      if (!href || href.startsWith('#') || href.startsWith('mailto:')) continue
      const resolved = new URL(href, baseURL)
      if (resolved.origin === new URL(baseURL!).origin) internal.add(resolved.pathname)
    }
  }
  for (const path of internal) expect((await request.get(path)).status(), path).toBe(200)
})

test('keyboard focus, dialog focus, touch targets, and reduced motion work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to matching tool' })).toBeFocused()
  const focusOutline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineWidth)
  expect(focusOutline).toBe('3px')
  await page.getByRole('button', { name: 'Pro details', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Close license dialog' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Pro details', exact: true })).toBeFocused()
  const controls = await page.locator('.site-footer a, .site-footer button').evaluateAll(elements => elements.map(element => ({ text: element.textContent?.trim(), height: element.getBoundingClientRect().height, width: element.getBoundingClientRect().width })))
  expect(controls.every(control => control.height >= 44 && control.width >= 44), JSON.stringify(controls)).toBe(true)
  expect(await page.locator('.hero-art').evaluate(element => getComputedStyle(element).animationDuration)).toBe('1e-05s')
})

test('an offline legal navigation renders the legal page rather than the matcher', async ({ browser, baseURL }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  try {
    await page.goto(`${baseURL}/`)
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload()
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
    await context.setOffline(true)
    await page.goto(`${baseURL}/privacy/`, { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveTitle('Privacy — Settlement Match')
    await expect(page.getByRole('heading', { name: 'How your data stays private' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Match a payout to your sales' })).toHaveCount(0)
    await page.goto(`${baseURL}/not-cached-before`, { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveTitle('Offline — Settlement Match')
    await expect(page.getByRole('heading', { name: 'This page is not available offline' })).toBeVisible()
  } finally {
    await context.close()
  }
})
