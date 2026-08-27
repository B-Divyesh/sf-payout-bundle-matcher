import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173'
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' })
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })

await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.keyboard.press('Tab')
const skipLinkReached = await page.evaluate(() => document.activeElement?.textContent === 'Skip to matching tool')
await page.keyboard.press('Enter')
const welcomeAxe = await new AxeBuilder({ page }).analyze()
await page.locator('#payout-file').setInputFiles({
  name: 'payout.csv', mimeType: 'text/csv',
  buffer: Buffer.from('payout_id,payout_date,net_amount,fees,refunds\nPO-1042,2026-08-26,285.50,9.50,25.00\n')
})
await page.locator('#sales-file').setInputFiles({
  name: 'sales.csv', mimeType: 'text/csv',
  buffer: Buffer.from('order_id,paid_date,gross_amount,processor_fee,refund_amount,status\nORD-100,2026-08-25,120.00,3.60,0,paid\nORD-101,2026-08-26,200.00,5.90,25.00,partially_refunded\nORD-VOID,2026-08-26,99.00,0,0,void\n')
})
await page.getByRole('button', { name: /Confirm files/ }).click()
await page.locator('#mapping-form input[type=checkbox]').check()
await page.getByRole('button', { name: /Use this mapping/ }).click()
await page.locator('.status.success').waitFor()
const variance = await page.locator('.variance dd').innerText()
const selected = await page.locator('.row-check:checked').count()
await page.locator('#reviewer-name').fill('Morgan Lee')
await page.locator('#signoff-form input[type=checkbox]').check()
await page.getByRole('button', { name: 'Sign off report' }).click()
await page.getByText('Report signed off').waitFor()
const matchedAxe = await new AxeBuilder({ page }).analyze()
await page.reload({ waitUntil: 'networkidle' })
await page.getByText('Report signed off').waitFor()
const controlledByServiceWorker = await page.evaluate(() => Boolean(navigator.serviceWorker.controller))

await page.context().setOffline(true)
await page.reload({ waitUntil: 'domcontentloaded' })
await page.getByText('Report signed off').waitFor()
await page.waitForTimeout(800)
const offlineNotice = await page.getByText('You’re offline.').isVisible()
const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
const overflowElements = await page.evaluate(() => [...document.querySelectorAll('*')].filter((element) => {
  const rect = element.getBoundingClientRect()
  return rect.right > window.innerWidth + 1 || rect.left < -1
}).slice(0, 12).map((element) => ({ tag: element.tagName, className: element.className, id: element.id, right: Math.round(element.getBoundingClientRect().right), width: Math.round(element.getBoundingClientRect().width) })))
await page.screenshot({ path: '.factory/evidence/screenshot-matched-mobile.png', fullPage: true })

async function mappingError(payoutDate, saleGross) {
  const regressionContext = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const regressionPage = await regressionContext.newPage()
  await regressionPage.goto(baseUrl, { waitUntil: 'networkidle' })
  await regressionPage.locator('#payout-file').setInputFiles({
    name: 'payout.csv', mimeType: 'text/csv',
    buffer: Buffer.from(`payout_id,payout_date,net_amount\nP-1,${payoutDate},100\n`)
  })
  await regressionPage.locator('#sales-file').setInputFiles({
    name: 'sales.csv', mimeType: 'text/csv',
    buffer: Buffer.from(`order_id,paid_date,gross_amount\nS-1,2026-03-02,${saleGross}\n`)
  })
  await regressionPage.getByRole('button', { name: /Confirm files/ }).click()
  await regressionPage.locator('#mapping-form input[type=checkbox]').check()
  await regressionPage.getByRole('button', { name: /Use this mapping/ }).click()
  const visibleError = await regressionPage.locator('.notice.error').innerText()
  const stillMapping = await regressionPage.locator('#mapping-form').isVisible()
  await regressionContext.close()
  return { visibleError, stillMapping }
}

const invalidDate = await mappingError('2026-02-30', '100')
const invalidMoney = await mappingError('2026-03-02', '12.34.56')
const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const desktopPage = await desktopContext.newPage()
await desktopPage.goto(baseUrl, { waitUntil: 'networkidle' })
const desktopOverflow = await desktopPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
await desktopContext.close()
await browser.close()

const seriousAxeViolations = [...welcomeAxe.violations, ...matchedAxe.violations].filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))
console.log(JSON.stringify({ variance, selected, skipLinkReached, signedStateSurvivedReload: true, controlledByServiceWorker, offlineReload: offlineNotice, hasHorizontalOverflow, desktopOverflow, overflowElements, invalidDate, invalidMoney, axeViolations: { welcome: welcomeAxe.violations.length, matched: matchedAxe.violations.length, seriousOrCritical: seriousAxeViolations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) })) }, errors }))
if (variance !== '$0.00' || selected !== 2 || !skipLinkReached || !controlledByServiceWorker || !offlineNotice || hasHorizontalOverflow || desktopOverflow || !invalidDate.stillMapping || !invalidMoney.stillMapping || !invalidDate.visibleError.includes('not a real calendar date') || !invalidMoney.visibleError.includes('not a valid money amount') || seriousAxeViolations.length || errors.length) process.exit(1)
