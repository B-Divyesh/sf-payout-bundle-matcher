import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const payoutCsv = 'payout_id,payout_date,net_amount,fees,refunds\nREAL-77,2026-08-26,285.50,9.50,25.00\n'
const salesCsv = 'order_id,paid_date,gross_amount,processor_fee,refund_amount,status\nREAL-A,2026-08-25,120.00,3.60,0,paid\nREAL-B,2026-08-26,200.00,5.90,25.00,partially refunded\n'

async function addFiles(page: Page, payout = payoutCsv, sales = salesCsv) {
  await page.goto('/')
  await expect(page.locator('#upload-form')).toBeVisible()
  await page.locator('#payout-file').setInputFiles({ name: 'payout.csv', mimeType: 'text/csv', buffer: Buffer.from(payout) })
  await page.locator('#sales-file').setInputFiles({ name: 'sales.csv', mimeType: 'text/csv', buffer: Buffer.from(sales) })
  await page.getByRole('button', { name: /Confirm files/ }).click()
  await expect(page.locator('#mapping-form')).toBeVisible()
}

async function completeMapping(page: Page) {
  await page.locator('#mapping-form input[type=checkbox]').check()
  await page.getByRole('button', { name: /Use this mapping/ }).click()
  await expect(page.locator('.variance dd')).toBeVisible()
}

async function signOff(page: Page, note = '') {
  await page.locator('#reviewer-name').fill('Sample Reviewer')
  if (note) await page.locator('#reviewer-note').fill(note)
  await page.locator('#signoff-form input[type=checkbox]').check()
  await page.getByRole('button', { name: 'Sign off report' }).click()
  await expect(page.getByRole('heading', { name: 'Report signed off' })).toBeVisible()
}

test('@claim:demo-isolation sample mode never reads or changes a real workspace', async ({ page }) => {
  await addFiles(page)
  await completeMapping(page)
  await expect(page.locator('#payout-row')).toContainText('REAL-77')
  await page.goto('/demo')
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible()
  await expect(page.locator('#payout-row')).toContainText('PO-1042')
  await expect(page.locator('#payout-row')).not.toContainText('REAL-77')
  await page.getByLabel('Include ORD-8831').uncheck()
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.getByLabel('Include ORD-8831')).toBeChecked()
  await page.getByRole('link', { name: 'Start for real' }).click()
  await expect(page.locator('#payout-row')).toContainText('REAL-77')
})

test('@claim:payout-reconciliation sample result explains sales, fees, refunds, timing, and variance', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.locator('.equation')).toContainText('Selected gross sales')
  await expect(page.locator('.equation')).toContainText('$320.00')
  await expect(page.locator('.equation')).toContainText('$9.50')
  await expect(page.locator('.equation')).toContainText('$25.00')
  await expect(page.locator('.variance dd')).toHaveText('$0.00')
  await expect(page.locator('.timing-note')).toContainText('1 timing shift')
  await expect(page.locator('.transactions tbody tr')).toHaveCount(4)
})

test('@claim:settlement-window changing the lookback changes suggested sales and the variance', async ({ page }) => {
  await page.goto('/demo')
  await page.locator('#timing-days').selectOption('0')
  await expect(page.locator('.row-check:checked')).toHaveCount(1)
  await expect(page.locator('.variance dd')).toHaveText('$116.40')
  await page.locator('#timing-days').selectOption('3')
  await expect(page.locator('.row-check:checked')).toHaveCount(2)
  await expect(page.locator('.variance dd')).toHaveText('$0.00')
})

test('@claim:mapping-confirmation no mapped amount is used before approval', async ({ page }) => {
  await addFiles(page)
  await expect(page.locator('.variance')).toHaveCount(0)
  await page.getByRole('button', { name: /Use this mapping/ }).click()
  await expect(page.locator('#mapping-form')).toBeVisible()
  await expect(page.locator('.variance')).toHaveCount(0)
  await completeMapping(page)
  await expect(page.locator('.variance dd')).toHaveText('$0.00')
})

test('@claim:signoff-persistence a signed real report survives reload', async ({ page }) => {
  await addFiles(page)
  await completeMapping(page)
  await signOff(page)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Report signed off' })).toBeVisible()
  await expect(page.getByText('Sample Reviewer')).toBeVisible()
})

test('@claim:exception-csv report export contains every decision and safe spreadsheet text', async ({ page }) => {
  await page.goto('/demo')
  await signOff(page)
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export exception CSV' }).click()
  const download = await pending
  const stream = await download.createReadStream()
  let csv = ''
  for await (const chunk of stream) csv += chunk
  expect(csv).toContain('Reference,Date,Status / note,Gross,Fee,Refund,Decision')
  expect(csv).toContain('ORD-8831,2026-08-25,paid,120.00,3.60,0.00,Included')
  expect(csv).toContain('ORD-8798,2026-08-20,paid,74.00,2.22,0.00,Excluded')
  expect(csv).toContain('SUMMARY,2026-08-26')
})

test('@claim:print-report signed reports open the browser print path', async ({ page }) => {
  await page.goto('/demo')
  await signOff(page)
  await page.evaluate(() => { window.print = () => { document.documentElement.dataset.printed = 'yes' } })
  await page.getByRole('button', { name: 'Print / save PDF' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-printed', 'yes')
})

test('@claim:workspace-portability an exported workspace restores its signed result', async ({ page }) => {
  await addFiles(page)
  await completeMapping(page)
  await signOff(page)
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export workspace' }).click()
  const exported = await pending
  const stream = await exported.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  const workspace = Buffer.concat(chunks)
  expect(workspace.length).toBeGreaterThan(100)
  await page.getByRole('button', { name: 'Delete local data' }).click()
  await page.getByRole('button', { name: 'Confirm: delete local data' }).click()
  await page.locator('#workspace-import').setInputFiles({ name: 'workspace.json', mimeType: 'application/json', buffer: workspace })
  await expect(page.locator('#payout-row')).toContainText('REAL-77')
  await expect(page.getByRole('heading', { name: 'Report signed off' })).toBeVisible()
})

test('@claim:delete-data deletion removes the saved workspace after reload', async ({ page }) => {
  await addFiles(page)
  await completeMapping(page)
  await page.getByRole('button', { name: 'Delete local data' }).click()
  await page.getByRole('button', { name: 'Confirm: delete local data' }).click()
  await expect(page.getByText('All imported and saved reconciliation data was deleted from this device.')).toBeVisible()
  await page.reload()
  await expect(page.locator('#upload-form')).toBeVisible()
  await expect(page.locator('#payout-row')).toHaveCount(0)
})

test('@claim:csv-size-limit a file over 10 MiB is rejected and a valid replacement recovers', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#upload-form')).toBeVisible()
  await page.locator('#payout-file').setInputFiles({ name: 'too-large.csv', mimeType: 'text/csv', buffer: Buffer.alloc(10 * 1024 * 1024 + 1, 65) })
  await expect(page.locator('.notice.error')).toContainText('10 MB or smaller')
  await page.locator('#payout-file').setInputFiles({ name: 'payout.csv', mimeType: 'text/csv', buffer: Buffer.from(payoutCsv) })
  await expect(page.getByText('payout.csv is ready; nothing was uploaded.')).toBeVisible()
})

test('@claim:local-processing a complete sample flow sends no customer data off origin', async ({ page, baseURL }) => {
  const requests: string[] = []
  page.on('request', request => requests.push(request.url()))
  await page.goto('/demo')
  await page.getByLabel('Include ORD-8798').check()
  await page.getByLabel('Include ORD-8798').uncheck()
  await signOff(page)
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export exception CSV' }).click()
  await pending
  const ownOrigin = new URL(baseURL!).origin
  expect([...new Set(requests.filter(request => new URL(request).origin !== ownOrigin))]).toEqual([])
})

test('@claim:workspace-persistence a real workspace is restored from browser storage', async ({ page }) => {
  await addFiles(page)
  await completeMapping(page)
  await page.reload()
  await expect(page.locator('#payout-row')).toContainText('REAL-77')
  await expect(page.locator('.variance dd')).toHaveText('$0.00')
  const databases = await page.evaluate(async () => (await indexedDB.databases()).map(database => database.name))
  expect(databases).toContain('settlement-match')
})

test('@claim:license-local-storage a returned license is kept locally and removed from the address', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/payout-bundle-matcher/verify**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":true,"reason":"ok"}' }))
  await page.goto('/?license=local-license-token')
  await expect(page.getByRole('button', { name: 'Pro active' })).toBeVisible()
  expect(page.url()).not.toContain('license=')
  const storage = await page.evaluate(() => ({ token: localStorage.getItem('sb_license:payout-bundle-matcher'), keys: Object.keys(localStorage) }))
  expect(storage.token).toBe('local-license-token')
  expect(storage.keys.every(key => key.startsWith('sb_license:payout-bundle-matcher'))).toBe(true)
})

test('@claim:offline-workflow the sample reloads and remains usable offline', async ({ browser, baseURL }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  try {
    await page.goto(`${baseURL}/demo`)
    await page.waitForFunction(() => 'serviceWorker' in navigator)
    await page.reload()
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
    await context.setOffline(true)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible()
    await expect(page.locator('.variance dd')).toHaveText('$0.00')
    await page.getByLabel('Include ORD-8831').uncheck()
    await expect(page.locator('.variance dd')).not.toHaveText('$0.00')
    await signOff(page, 'Sample exception checked while offline.')
    const pending = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export exception CSV' }).click()
    await pending
  } finally {
    await context.close()
  }
})

test('@claim:free-core matching, sign-off, and both report exports work without a license', async ({ page }) => {
  await page.goto('/demo')
  expect(await page.evaluate(() => localStorage.getItem('sb_license:payout-bundle-matcher'))).toBeNull()
  await expect(page.locator('.variance dd')).toHaveText('$0.00')
  const axe = await new AxeBuilder({ page }).analyze()
  expect(axe.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''))).toEqual([])
  await signOff(page)
  await expect(page.getByRole('button', { name: 'Print / save PDF' })).toBeEnabled()
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export exception CSV' }).click()
  await pending
})

test('@claim:pro-status the exact Pro price and unavailable checkout status are clear', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.price-block')).toContainText('$19 once')
  await expect(page.locator('.price-block')).toContainText('not available to buy yet')
  await page.getByRole('button', { name: 'Review Pro details' }).click()
  await expect(page.locator('#license-dialog')).toContainText('One-time license · $19')
  await expect(page.locator('#license-dialog')).toContainText('Checkout is not available yet')
  await expect(page.locator('#license-dialog a[href*="checkout"]')).toHaveCount(0)
})

test('@claim:pro-features a verified license saves a reusable map and removes the print credit', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/payout-bundle-matcher/verify**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":true,"reason":"ok"}' }))
  await page.goto('/?license=verified-token')
  await expect(page.getByRole('button', { name: 'Pro active' })).toBeVisible()
  await page.locator('#payout-file').setInputFiles({ name: 'payout.csv', mimeType: 'text/csv', buffer: Buffer.from(payoutCsv) })
  await page.locator('#sales-file').setInputFiles({ name: 'sales.csv', mimeType: 'text/csv', buffer: Buffer.from(salesCsv) })
  await page.getByRole('button', { name: /Confirm files/ }).click()
  await page.getByRole('button', { name: 'Save map for next time' }).click()
  expect(await page.evaluate(() => localStorage.getItem('sm_mapping_preset'))).toContain('payout_id')
  await completeMapping(page)
  await signOff(page)
  await page.evaluate(() => { window.print = () => undefined })
  await page.getByRole('button', { name: 'Print / save PDF' }).click()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.print-credit')).toBeHidden()
})

test('@claim:billing-api-only restoring a license contacts only the Sociobot billing API', async ({ page, baseURL }) => {
  const requests: string[] = []
  page.on('request', request => requests.push(request.url()))
  await page.route('https://api.sociobot.in/api/v1/products/payout-bundle-matcher/verify**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":false,"reason":"invalid"}' }))
  await page.goto('/')
  await page.getByRole('button', { name: 'Pro details', exact: true }).click()
  await page.locator('#license-token').fill('invalid-test-token')
  await page.getByRole('button', { name: 'Restore license' }).click()
  await expect(page.getByText('That license could not be verified.')).toBeVisible()
  const ownOrigin = new URL(baseURL!).origin
  const external = [...new Set(requests.filter(request => new URL(request).origin !== ownOrigin))]
  expect(external).toHaveLength(1)
  expect(external[0]).toMatch(/^https:\/\/api\.sociobot\.in\/api\/v1\/products\/payout-bundle-matcher\/verify\?license=/)
})
