import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173'
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' })
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const page = await context.newPage()
const errors = []
const requests = []
page.on('pageerror', (error) => errors.push(String(error)))
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
page.on('request', (request) => requests.push(request.url()))

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.keyboard.press('Tab')
  const focus = await page.evaluate(() => {
    const element = document.activeElement
    const style = element ? getComputedStyle(element) : undefined
    return { text: element?.textContent, outlineWidth: style?.outlineWidth, transform: style?.transform }
  })
  const welcomeAxe = await new AxeBuilder({ page }).analyze()
  await page.getByRole('button', { name: 'Pro details', exact: true }).click()
  const checkoutLinks = await page.locator('#license-dialog a[href*="checkout"]').count()
  const checkoutStatus = await page.locator('#license-dialog .offer-unavailable').innerText()
  await page.getByRole('button', { name: 'Close license dialog' }).click()

  // A malformed CSV must not destroy the empty workspace, and a replacement must recover.
  await page.locator('#payout-file').setInputFiles({ name: 'bad.csv', mimeType: 'text/csv', buffer: Buffer.from('only_header\n') })
  const malformedCsv = await page.locator('.notice.error').innerText()
  await page.locator('#payout-file').setInputFiles({ name: 'payout.csv', mimeType: 'text/csv', buffer: Buffer.from('payout_id,payout_date,net_amount\nP-BOUNDARY,2024-02-29,100.00\n') })
  await page.locator('#sales-file').setInputFiles({ name: 'sales.csv', mimeType: 'text/csv', buffer: Buffer.from('order_id,paid_date,gross_amount,status\n=INJECT,2024-02-29,80.00,paid\n') })
  await page.getByRole('button', { name: /Confirm files/ }).click()
  await page.locator('#mapping-form input[type=checkbox]').check()
  await page.getByRole('button', { name: /Use this mapping/ }).click()
  const variance = await page.locator('.variance dd').innerText()

  // An exception cannot be signed without the explanatory note required by the product contract.
  await page.locator('#reviewer-name').fill('Boundary Reviewer')
  await page.locator('#signoff-form input[type=checkbox]').check()
  await page.getByRole('button', { name: 'Sign off report' }).click()
  const exceptionNoteRequired = await page.locator('#reviewer-note').evaluate((node) => node.required)
  const stillReviewing = await page.getByRole('heading', { name: 'Complete the review' }).isVisible()
  await page.locator('#reviewer-note').fill('Payout is short by $20; follow up with processor.')
  await page.getByRole('button', { name: 'Sign off report' }).click()
  await page.getByText('Report signed off').waitFor()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export exception CSV' }).click()
  const download = await downloadPromise
  const stream = await download.createReadStream()
  let csv = ''
  for await (const chunk of stream) csv += chunk
  const csvFormulaSafe = csv.includes("'=INJECT")

  await page.getByRole('button', { name: 'Delete local data' }).click()
  await page.getByRole('button', { name: 'Confirm: delete local data' }).click()
  await page.getByText('All imported and saved reconciliation data was deleted from this device.').waitFor()
  await page.reload({ waitUntil: 'networkidle' })
  const deleteSurvivedReload = await page.getByRole('button', { name: /Confirm files/ }).isVisible()

  await page.screenshot({ path: '.factory/evidence/verification-3-desktop.png', fullPage: true })
  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const reducedPage = await reducedContext.newPage()
  await reducedPage.goto(baseUrl, { waitUntil: 'networkidle' })
  const reducedMotion = await reducedPage.locator('.hero-art').evaluate((node) => getComputedStyle(node).animationDuration)
  const mobileOverflow = await reducedPage.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  await reducedPage.screenshot({ path: '.factory/evidence/verification-3-mobile.png', fullPage: true })
  const legalPage = await reducedContext.newPage()
  await legalPage.goto(new URL('/privacy/', baseUrl).href, { waitUntil: 'networkidle' })
  const privacyAxe = await new AxeBuilder({ page: legalPage }).analyze()
  await reducedContext.close()

  const ownOrigin = new URL(baseUrl).origin
  const externalRequests = [...new Set(requests.filter((url) => new URL(url).origin !== ownOrigin))]
  const seriousOrCritical = [...welcomeAxe.violations, ...privacyAxe.violations].filter((item) => ['serious', 'critical'].includes(item.impact || ''))
  const result = { focus, checkoutLinks, checkoutStatus, malformedCsv, variance, exceptionNoteRequired, stillReviewing, csvFormulaSafe, deleteSurvivedReload, reducedMotion, mobileOverflow, welcomeAxe: welcomeAxe.violations.length, privacyAxe: privacyAxe.violations.length, seriousOrCritical: seriousOrCritical.map((item) => item.id), externalRequests, errors }
  console.log(JSON.stringify(result))
  if (focus.text !== 'Skip to matching tool' || focus.outlineWidth !== '3px' || focus.transform !== 'none' || checkoutLinks !== 0 || !checkoutStatus.includes('Checkout is not available yet') || !malformedCsv.includes('header row and at least one data row') || variance !== '$20.00' || !exceptionNoteRequired || !stillReviewing || !csvFormulaSafe || !deleteSurvivedReload || !['0.01s', '1e-05s'].includes(reducedMotion) || mobileOverflow || seriousOrCritical.length || externalRequests.length || errors.length) process.exitCode = 1
} finally {
  await context.close()
  await browser.close()
}
