import './styles.css'
import { parseCsv, guessColumn, rowsToCsv } from './csv'
import { clearState, loadState, saveState } from './db'
import { captureLicense, checkoutUrl, hasOptimisticLicense, storeLicense, verifyLicense } from './license'
import { reconcile, suggestedKeys, toPayout, toSales } from './reconcile'
import type { AppState, ImportedFile, Mapping, Payout, Reconciliation, Sale } from './types'

const app = document.querySelector<HTMLDivElement>('#app')!
const emptyState = (): AppState => ({
  version: 1,
  stage: 'welcome',
  payoutRow: 0,
  selectedKeys: [],
  timingDays: 3,
  currency: 'USD',
  updatedAt: new Date().toISOString()
})

let state: AppState = emptyState()
let licensed = false
let busy = true
let message = ''
let error = ''
let deleteArmed = false

captureLicense()
licensed = hasOptimisticLicense()
render()

void loadState().then((saved) => {
  if (saved?.version === 1) state = saved
}).catch(() => {
  message = 'Local saving is unavailable in this browser. You can still match and export this session.'
}).finally(() => {
  busy = false
  render()
})

void verifyLicense().then((valid) => {
  const wasLicensed = licensed
  licensed = valid
  if (wasLicensed && !valid) message = 'Your license is no longer active. The free matcher and exports still work.'
  render()
})

function h(value: unknown): string {
  return String(value ?? '').replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]!)
}

function money(value: number): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: state.currency }).format(value)
  } catch {
    return `${state.currency} ${value.toFixed(2)}`
  }
}

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}

function mappingGuess(payoutFile: ImportedFile, salesFile: ImportedFile): Mapping {
  return {
    payout: {
      id: guessColumn(payoutFile.headers, ['payoutid', 'settlementid', 'id']),
      date: guessColumn(payoutFile.headers, ['payoutdate', 'settlementdate', 'arrivaldate', 'date']),
      amount: guessColumn(payoutFile.headers, ['netamount', 'payoutamount', 'depositamount', 'amount', 'net']),
      gross: guessColumn(payoutFile.headers, ['grossamount', 'gross'], true),
      fee: guessColumn(payoutFile.headers, ['fees', 'fee'], true),
      refund: guessColumn(payoutFile.headers, ['refunds', 'refund'], true)
    },
    sales: {
      id: guessColumn(salesFile.headers, ['orderid', 'invoiceid', 'transactionid', 'id']),
      date: guessColumn(salesFile.headers, ['paiddate', 'orderdate', 'invoicedate', 'date']),
      gross: guessColumn(salesFile.headers, ['grossamount', 'totalamount', 'amount', 'total', 'gross']),
      fee: guessColumn(salesFile.headers, ['processorfee', 'paymentfee', 'fees', 'fee'], true),
      refund: guessColumn(salesFile.headers, ['refundamount', 'refunded', 'refunds', 'refund'], true),
      status: guessColumn(salesFile.headers, ['paymentstatus', 'status'], true)
    }
  }
}

function currentData(): { payout: Payout; sales: Sale[]; result: Reconciliation } | undefined {
  if (!state.mapping || !state.payoutFile || !state.salesFile) return
  const payout = toPayout(state.payoutFile.rows[state.payoutRow], state.payoutRow, state.mapping.payout)
  const sales = toSales(state.salesFile.rows, state.mapping.sales)
  return { payout, sales, result: reconcile(sales, state.selectedKeys, payout) }
}

async function persist(): Promise<void> {
  state.updatedAt = new Date().toISOString()
  try { await saveState(state) } catch { /* already warned where possible */ }
}

function announce(text: string): void {
  message = text
  error = ''
}

function render(): void {
  let workspace = ''
  if (busy) {
    workspace = `<section class="loading-state" aria-busy="true"><span class="spinner" aria-hidden="true"></span><h2>Opening your local workspace…</h2></section>`
  } else if (state.stage === 'map' && state.payoutFile && state.salesFile) {
    workspace = renderMapping()
  } else if ((state.stage === 'match' || state.stage === 'signed') && state.mapping) {
    try { workspace = renderMatch() } catch (caught) {
      error = caught instanceof Error ? caught.message : 'The mapped values could not be read.'
      workspace = renderMapping()
    }
  } else {
    workspace = renderUpload()
  }

  app.innerHTML = `
    <header class="site-header">
      <a class="wordmark" href="#top" aria-label="Settlement Match home"><span class="mark" aria-hidden="true"><i></i><b></b></span>Settlement Match</a>
      <nav aria-label="Main navigation">
        <a href="#matcher">Matcher</a>
        <button class="text-button" type="button" data-action="open-license">${licensed ? 'Pro active' : 'Get Pro'}</button>
        <button class="text-button" type="button" data-action="import-data">Import data</button>
        <button class="text-button" type="button" data-action="export-data">Export data</button>
        <input class="sr-only" id="workspace-import" type="file" accept="application/json,.json" aria-label="Import Settlement Match workspace" />
      </nav>
    </header>
    <main id="main">
      <section class="hero" id="top">
        <div class="hero-copy">
          <p class="eyebrow">One payout. Every moving part.</p>
          <h1>Make the deposit<br><em>make sense.</em></h1>
          <p class="lede">Match a processor payout to the sales, fees, refunds, and timing shifts behind it. Your CSVs stay in this browser.</p>
          <div class="hero-actions">
            <a class="button primary" href="#matcher">Match a payout <span aria-hidden="true">↓</span></a>
            <span class="privacy-note"><span aria-hidden="true">●</span> Local-only processing</span>
          </div>
        </div>
        <figure class="hero-art">
          <img src="/settlement-landscape.webp" width="1152" height="768" alt="A coral coin and a fan of receipts balancing across a dark arch" fetchpriority="high" decoding="async" />
          <figcaption>Many transactions arrive as one.</figcaption>
        </figure>
      </section>
      <section class="workspace" id="matcher" aria-labelledby="workspace-title">
        <div class="workspace-heading">
          <div><p class="eyebrow">Private workspace</p><h2 id="workspace-title">Reconcile one payout</h2></div>
          ${renderSteps()}
        </div>
        <div id="notice" class="notice-stack" aria-live="polite">
          ${error ? `<div class="notice error"><strong>Check the file or mapping.</strong> ${h(error)}</div>` : ''}
          ${message ? `<div class="notice"><strong>Workspace update.</strong> ${h(message)}</div>` : ''}
          ${!navigator.onLine ? `<div class="notice offline"><strong>You’re offline.</strong> Matching, saving, and exports still work on this device.</div>` : ''}
        </div>
        ${workspace}
      </section>
      <section class="method" aria-labelledby="method-title">
        <p class="eyebrow">A bounded tool, by design</p>
        <h2 id="method-title">Evidence, not accounting theatre.</h2>
        <div class="method-grid">
          <p><span>01</span><strong>Confirm every column</strong>We suggest mappings, but no amount is used until you approve it.</p>
          <p><span>02</span><strong>See the arithmetic</strong>Gross minus fees and refunds is compared directly with the deposit.</p>
          <p><span>03</span><strong>Keep custody</strong>No bank login, upload server, analytics script, or automatic posting.</p>
        </div>
      </section>
    </main>
    <footer>
      <p><strong>Settlement Match</strong><br>A local reconciliation utility—not accounting or tax advice.</p>
      <div><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><button class="footer-button" data-action="delete-data" type="button">${deleteArmed ? 'Confirm: delete local data' : 'Delete local data'}</button></div>
      <p class="art-credit">Original AI-generated editorial artwork · No customer data leaves this device.</p>
    </footer>
    <div class="toast" id="update-toast" hidden role="status">A new version is ready. <button type="button" data-action="update-app">Update now</button></div>
    <dialog id="license-dialog" aria-labelledby="license-title">
      <button class="dialog-close" type="button" data-action="close-license" aria-label="Close license dialog">×</button>
      <p class="eyebrow">One-time license · $19</p>
      <h2 id="license-title">Reuse your setup with Pro.</h2>
      <p>The free matcher and every export stay free. Pro saves reusable column maps on this device and removes the tool credit from signed print reports.</p>
      ${licensed ? `<p class="license-active"><span aria-hidden="true">✓</span> Pro is active on this device.</p>` : `<a class="button primary wide" href="${checkoutUrl()}">Buy Pro securely</a>`}
      <form id="license-form">
        <label for="license-token">Have a license? Paste it here</label>
        <div class="inline-form"><input id="license-token" name="license" autocomplete="off" required /><button class="button secondary" type="submit">Restore</button></div>
      </form>
      <p class="fine-print">Checkout and refunds are handled by Sociobot/Dodo, the merchant of record. <a href="/terms/">Terms apply.</a></p>
    </dialog>`
  bindEvents()
}

function renderSteps(): string {
  const order = ['upload', 'map', 'match', 'signed'] as const
  const labels = ['Upload', 'Map', 'Match', 'Sign off']
  const normalized = state.stage === 'welcome' ? 'upload' : state.stage
  const active = order.indexOf(normalized)
  return `<ol class="steps" aria-label="Reconciliation progress">${labels.map((label, index) => `<li class="${index === active ? 'active' : ''} ${index < active ? 'done' : ''}" ${index === active ? 'aria-current="step"' : ''}><span>${index < active ? '✓' : index + 1}</span>${label}</li>`).join('')}</ol>`
}

function renderUpload(): string {
  return `<div class="upload-layout">
    <div class="upload-intro"><h3>Bring two exports</h3><p>Start with the processor’s payout CSV and the sales or invoice CSV that may be inside it. We do not need a bank export.</p><div class="file-tip"><strong>Before you begin</strong><span>Keep the original files unchanged. You will confirm dates and money columns next.</span></div></div>
    <form id="upload-form" class="upload-form">
      ${fileInput('payout', '1', 'Processor payout CSV', 'The deposit amount and payout date.', state.payoutFile)}
      ${fileInput('sales', '2', 'Sales or invoice CSV', 'Order totals, paid dates, and optional fees/refunds.', state.salesFile)}
      <div class="upload-actions"><button class="button primary" type="submit" ${!state.payoutFile || !state.salesFile ? 'disabled' : ''}>Confirm files <span aria-hidden="true">→</span></button><button class="text-button sample-button" type="button" data-action="download-samples">Download sample CSVs</button></div>
    </form>
  </div>`
}

function fileInput(kind: 'payout' | 'sales', number: string, title: string, copy: string, file?: ImportedFile): string {
  return `<label class="file-drop ${file ? 'has-file' : ''}" for="${kind}-file"><span class="file-number">${file ? '✓' : number}</span><span><strong>${file ? h(file.name) : title}</strong><small>${file ? `${file.rows.length} row${file.rows.length === 1 ? '' : 's'} · ${file.headers.length} columns` : copy}</small></span><span class="file-action">${file ? 'Replace' : 'Choose CSV'}</span><input id="${kind}-file" name="${kind}" type="file" accept=".csv,text/csv" /></label>`
}

function renderMapping(): string {
  const { payoutFile, salesFile } = state
  if (!payoutFile || !salesFile) return renderUpload()
  const mapping = state.mapping ?? mappingGuess(payoutFile, salesFile)
  return `<form id="mapping-form" class="mapping-form">
    <div class="mapping-head"><div><h3>Confirm the suggested columns</h3><p>Required fields are marked. Optional fee and refund fields can come from either export.</p></div><button class="text-button" type="button" data-action="back-upload">← Replace files</button></div>
    <div class="mapping-columns">
      <fieldset><legend><span>Processor</span>${h(payoutFile.name)}</legend>
        ${selectField('payout-id', 'Payout ID', payoutFile.headers, mapping.payout.id, false)}
        ${selectField('payout-date', 'Payout date', payoutFile.headers, mapping.payout.date, true)}
        ${selectField('payout-amount', 'Deposit / net amount', payoutFile.headers, mapping.payout.amount, true)}
        ${selectField('payout-gross', 'Gross amount', payoutFile.headers, mapping.payout.gross, false, true)}
        ${selectField('payout-fee', 'Fees', payoutFile.headers, mapping.payout.fee, false, true)}
        ${selectField('payout-refund', 'Refunds', payoutFile.headers, mapping.payout.refund, false, true)}
      </fieldset>
      <fieldset><legend><span>Sales</span>${h(salesFile.name)}</legend>
        ${selectField('sales-id', 'Order / invoice ID', salesFile.headers, mapping.sales.id, false)}
        ${selectField('sales-date', 'Paid / sale date', salesFile.headers, mapping.sales.date, true)}
        ${selectField('sales-gross', 'Gross sale amount', salesFile.headers, mapping.sales.gross, true)}
        ${selectField('sales-fee', 'Per-sale fee', salesFile.headers, mapping.sales.fee, false, true)}
        ${selectField('sales-refund', 'Per-sale refund', salesFile.headers, mapping.sales.refund, false, true)}
        ${selectField('sales-status', 'Status', salesFile.headers, mapping.sales.status, false, true)}
      </fieldset>
    </div>
    <div class="mapping-preview"><strong>Raw-file preview</strong><span>${payoutFile.headers.slice(0, 4).map(h).join(' · ')}</span><span>${salesFile.headers.slice(0, 4).map(h).join(' · ')}</span></div>
    <div class="form-footer"><label class="check-label"><input type="checkbox" required /> <span>I checked the date and money columns above.</span></label><div><button class="button secondary" type="button" data-action="save-map">${licensed ? 'Save map for next time' : 'Save map with Pro'}</button><button class="button primary" type="submit">Use this mapping <span aria-hidden="true">→</span></button></div></div>
  </form>`
}

function selectField(id: string, label: string, headers: string[], selected: string, required: boolean, empty = false): string {
  return `<label for="${id}"><span>${label}${required ? ' <em>Required</em>' : ''}</span><select id="${id}" name="${id}" ${required ? 'required' : ''}>${empty ? '<option value="">Not in this file</option>' : ''}${headers.map((header) => `<option value="${h(header)}" ${header === selected ? 'selected' : ''}>${h(header)}</option>`).join('')}</select></label>`
}

function formMapping(form: HTMLFormElement): Mapping {
  const data = new FormData(form)
  const value = (key: string) => String(data.get(key) ?? '')
  return {
    payout: { id: value('payout-id'), date: value('payout-date'), amount: value('payout-amount'), gross: value('payout-gross'), fee: value('payout-fee'), refund: value('payout-refund') },
    sales: { id: value('sales-id'), date: value('sales-date'), gross: value('sales-gross'), fee: value('sales-fee'), refund: value('sales-refund'), status: value('sales-status') }
  }
}

function renderMatch(): string {
  const data = currentData()
  if (!data || !state.payoutFile) throw new Error('The imported files are missing. Please start again.')
  const { payout, sales, result } = data
  const explained = Math.abs(result.variance) < 0.01
  return `<div class="match-view">
    <div class="match-toolbar">
      <label for="payout-row"><span>Payout to explain</span><select id="payout-row">${state.payoutFile.rows.map((_, index) => {
        const item = toPayout(state.payoutFile!.rows[index], index, state.mapping!.payout)
        return `<option value="${index}" ${index === state.payoutRow ? 'selected' : ''}>${h(item.id)} · ${money(item.amount)}</option>`
      }).join('')}</select></label>
      <label for="timing-days"><span>Look back</span><select id="timing-days">${[0, 1, 2, 3, 5, 7, 14].map((days) => `<option value="${days}" ${days === state.timingDays ? 'selected' : ''}>${days === 0 ? 'Same day' : `${days} days`}</option>`).join('')}</select></label>
      <label for="currency"><span>Currency</span><select id="currency">${['USD', 'GBP', 'EUR', 'CAD', 'AUD', 'INR'].map((currency) => `<option ${currency === state.currency ? 'selected' : ''}>${currency}</option>`).join('')}</select></label>
      <button class="text-button" type="button" data-action="edit-map">Edit columns</button>
    </div>
    <div class="balance-sheet">
      <section class="calculation" aria-labelledby="calc-title">
        <div class="section-heading"><div><p class="eyebrow">Bundle calculation</p><h3 id="calc-title">What should have arrived</h3></div><span class="status ${explained ? 'success' : 'warning'}">${explained ? '✓ Explained' : '△ Exception remains'}</span></div>
        <dl class="equation">
          <div><dt>Selected gross sales <small>${result.selected.length} transactions</small></dt><dd>${money(result.gross)}</dd></div>
          <div><dt>Processor fees</dt><dd>− ${money(result.fees)}</dd></div>
          <div><dt>Refunds</dt><dd>− ${money(result.refunds)}</dd></div>
          <div class="expected"><dt>Expected proceeds</dt><dd>${money(result.expected)}</dd></div>
          <div><dt>Actual payout <small>${h(payout.id)} · ${dateLabel(payout.date)}</small></dt><dd>${money(result.payout)}</dd></div>
          <div class="variance ${explained ? 'zero' : ''}"><dt>Unexplained variance</dt><dd>${money(result.variance)}</dd></div>
        </dl>
        <p class="timing-note"><span aria-hidden="true">↗</span><strong>${result.timingShiftCount} timing shift${result.timingShiftCount === 1 ? '' : 's'}</strong> ${result.timingShiftCount ? `came from dates before ${dateLabel(payout.date)}.` : 'All selected sales are from the payout date.'}</p>
      </section>
      <section class="signoff-panel" aria-labelledby="signoff-title">
        <p class="eyebrow">Review decision</p><h3 id="signoff-title">${state.signoff ? 'Report signed off' : 'Complete the trail'}</h3>
        ${state.signoff ? `<div class="signed-stamp"><span>Signed</span><strong>${h(state.signoff.name)}</strong><small>${new Date(state.signoff.at).toLocaleString()} · ${h(state.signoff.reportId)}</small></div><p>${h(state.signoff.note || 'No reviewer note.')}</p><div class="stack-actions"><button class="button primary" type="button" data-action="print-report">Print / save PDF</button><button class="button secondary" type="button" data-action="export-report">Export exception CSV</button><button class="text-button" type="button" data-action="reopen">Reopen review</button></div>` : `<form id="signoff-form"><label for="reviewer-name">Reviewer name<input id="reviewer-name" name="name" required autocomplete="name" /></label><label for="reviewer-note">Exception note <small>${explained ? 'optional' : 'required while variance remains'}</small><textarea id="reviewer-note" name="note" rows="4" ${explained ? '' : 'required'} placeholder="What was checked or needs follow-up?"></textarea></label><label class="check-label"><input type="checkbox" required /><span>I reviewed the selected transactions and arithmetic.</span></label><button class="button primary wide" type="submit">Sign off report</button></form>`}
      </section>
    </div>
    <section class="transactions" aria-labelledby="transactions-title">
      <div class="section-heading"><div><p class="eyebrow">Bundle contents</p><h3 id="transactions-title">Transactions in the window</h3></div><div><button class="text-button" type="button" data-action="select-suggested">Reset suggestion</button><button class="text-button" type="button" data-action="toggle-all">${result.selected.length === sales.length ? 'Exclude all' : 'Include all'}</button></div></div>
      <div class="table-wrap"><table><caption class="sr-only">Sales candidates for payout ${h(payout.id)}</caption><thead><tr><th scope="col">Include</th><th scope="col">Order / invoice</th><th scope="col">Sale date</th><th scope="col">Status</th><th scope="col" class="number">Gross</th><th scope="col" class="number">Fee</th><th scope="col" class="number">Refund</th></tr></thead><tbody>${sales.map((sale) => `<tr class="${state.selectedKeys.includes(sale.key) ? '' : 'excluded'}"><td><input class="row-check" type="checkbox" data-key="${sale.key}" aria-label="Include ${h(sale.id)}" ${state.selectedKeys.includes(sale.key) ? 'checked' : ''} /></td><th scope="row">${h(sale.id)}</th><td>${dateLabel(sale.date)}${sale.date !== payout.date ? '<small class="shift">Timing shift</small>' : ''}</td><td>${h(sale.status)}</td><td class="number">${money(sale.gross)}</td><td class="number">${money(sale.fee)}</td><td class="number">${money(sale.refund)}</td></tr>`).join('')}</tbody></table></div>
      <p class="table-help">Included rows feed the calculation above. Change any checkbox to test the bundle; your last selection is saved locally.</p>
    </section>
  </div>`
}

function bindEvents(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => button.addEventListener('click', () => void action(button.dataset.action!)))
  document.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((input) => input.addEventListener('change', () => void handleFile(input)))
  document.querySelector<HTMLFormElement>('#upload-form')?.addEventListener('submit', submitUpload)
  document.querySelector<HTMLFormElement>('#mapping-form')?.addEventListener('submit', submitMapping)
  document.querySelector<HTMLFormElement>('#signoff-form')?.addEventListener('submit', submitSignoff)
  document.querySelector<HTMLFormElement>('#license-form')?.addEventListener('submit', submitLicense)
  document.querySelectorAll<HTMLInputElement>('.row-check').forEach((input) => input.addEventListener('change', () => void toggleRow(input)))
  document.querySelector<HTMLSelectElement>('#payout-row')?.addEventListener('change', changeMatchControls)
  document.querySelector<HTMLSelectElement>('#timing-days')?.addEventListener('change', changeMatchControls)
  document.querySelector<HTMLSelectElement>('#currency')?.addEventListener('change', changeCurrency)
  document.querySelector<HTMLInputElement>('#workspace-import')?.addEventListener('change', importData)
}

async function handleFile(input: HTMLInputElement): Promise<void> {
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) { error = 'Each CSV must be 10 MB or smaller for this device.'; render(); return }
  try {
    const parsed = parseCsv(await file.text(), file.name)
    if (input.name === 'payout') state.payoutFile = parsed
    else state.salesFile = parsed
    error = ''
    announce(`${file.name} is ready; nothing was uploaded.`)
    await persist()
  } catch (caught) {
    error = caught instanceof Error ? caught.message : 'This file could not be read.'
  }
  render()
}

function submitUpload(event: SubmitEvent): void {
  event.preventDefault()
  if (!state.payoutFile || !state.salesFile) return
  state.mapping = mappingGuess(state.payoutFile, state.salesFile)
  if (licensed) {
    try {
      const saved = JSON.parse(localStorage.getItem('sm_mapping_preset') || 'null') as Mapping | null
      const payoutValid = saved && Object.values(saved.payout).every((column) => !column || state.payoutFile!.headers.includes(column))
      const salesValid = saved && Object.values(saved.sales).every((column) => !column || state.salesFile!.headers.includes(column))
      if (saved && payoutValid && salesValid) { state.mapping = saved; message = 'Your saved Pro column map was applied. Please confirm it.' }
    } catch { /* ignore a damaged optional preset */ }
  }
  state.stage = 'map'
  state.signoff = undefined
  void persist()
  render()
}

function submitMapping(event: SubmitEvent): void {
  event.preventDefault()
  const form = event.currentTarget as HTMLFormElement
  try {
    state.mapping = formMapping(form)
    const payout = toPayout(state.payoutFile!.rows[state.payoutRow], state.payoutRow, state.mapping.payout)
    const sales = toSales(state.salesFile!.rows, state.mapping.sales)
    state.selectedKeys = suggestedKeys(sales, payout, state.timingDays)
    state.stage = 'match'
    state.signoff = undefined
    announce(`Suggested ${state.selectedKeys.length} transaction${state.selectedKeys.length === 1 ? '' : 's'} from the ${state.timingDays}-day window.`)
    void persist()
  } catch (caught) {
    error = caught instanceof Error ? caught.message : 'The mapped values could not be read.'
  }
  render()
}

function submitSignoff(event: SubmitEvent): void {
  event.preventDefault()
  const form = new FormData(event.currentTarget as HTMLFormElement)
  state.signoff = {
    name: String(form.get('name') ?? '').trim(), note: String(form.get('note') ?? '').trim(),
    at: new Date().toISOString(), reportId: `SM-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  }
  state.stage = 'signed'
  announce('The report is signed and saved locally. Export a copy for your records.')
  void persist()
  render()
}

async function submitLicense(event: SubmitEvent): Promise<void> {
  event.preventDefault()
  const token = String(new FormData(event.currentTarget as HTMLFormElement).get('license') ?? '')
  storeLicense(token)
  licensed = true
  render()
  licensed = await verifyLicense(true)
  announce(licensed ? 'Pro is restored on this device.' : 'That license could not be verified. Check the token and try again.')
  render()
  document.querySelector<HTMLDialogElement>('#license-dialog')?.showModal()
}

async function toggleRow(input: HTMLInputElement): Promise<void> {
  const key = input.dataset.key!
  state.selectedKeys = input.checked ? [...state.selectedKeys, key] : state.selectedKeys.filter((item) => item !== key)
  state.signoff = undefined
  state.stage = 'match'
  await persist(); render()
}

function changeMatchControls(): void {
  state.payoutRow = Number(document.querySelector<HTMLSelectElement>('#payout-row')!.value)
  state.timingDays = Number(document.querySelector<HTMLSelectElement>('#timing-days')!.value)
  const data = currentData()
  if (data) state.selectedKeys = suggestedKeys(data.sales, data.payout, state.timingDays)
  state.signoff = undefined; state.stage = 'match'; void persist(); render()
}

function changeCurrency(): void {
  state.currency = document.querySelector<HTMLSelectElement>('#currency')!.value
  void persist(); render()
}

async function action(name: string): Promise<void> {
  const dialog = document.querySelector<HTMLDialogElement>('#license-dialog')
  if (name === 'open-license') { dialog?.showModal(); return }
  if (name === 'close-license') { dialog?.close(); return }
  if (name === 'back-upload') { state.stage = 'upload'; await persist(); render(); return }
  if (name === 'edit-map') { state.stage = 'map'; state.signoff = undefined; await persist(); render(); return }
  if (name === 'reopen') { state.stage = 'match'; state.signoff = undefined; await persist(); render(); return }
  if (name === 'print-report') { document.body.classList.toggle('pro-print', licensed); window.print(); return }
  if (name === 'export-report') { exportReport(); return }
  if (name === 'export-data') { exportData(); return }
  if (name === 'import-data') { document.querySelector<HTMLInputElement>('#workspace-import')?.click(); return }
  if (name === 'download-samples') { downloadSamples(); return }
  if (name === 'select-suggested') {
    const data = currentData(); if (data) state.selectedKeys = suggestedKeys(data.sales, data.payout, state.timingDays)
    state.signoff = undefined; state.stage = 'match'; await persist(); render(); return
  }
  if (name === 'toggle-all') {
    const data = currentData(); if (data) state.selectedKeys = state.selectedKeys.length === data.sales.length ? [] : data.sales.map((sale) => sale.key)
    state.signoff = undefined; state.stage = 'match'; await persist(); render(); return
  }
  if (name === 'save-map') {
    if (!licensed) { dialog?.showModal(); return }
    const form = document.querySelector<HTMLFormElement>('#mapping-form')
    if (form) localStorage.setItem('sm_mapping_preset', JSON.stringify(formMapping(form)))
    announce('This column map is saved on this device.'); render(); return
  }
  if (name === 'delete-data') {
    if (!deleteArmed) { deleteArmed = true; message = 'Press the delete button again to remove imported rows and the signed report.'; render(); return }
    await clearState(); state = emptyState(); deleteArmed = false; announce('All imported and saved reconciliation data was deleted from this device.'); render(); return
  }
  if (name === 'update-app') { navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' }); location.reload(); return }
}

async function importData(event: Event): Promise<void> {
  const input = event.currentTarget as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const parsed = JSON.parse(await file.text()) as AppState
    if (parsed.version !== 1 || !['welcome', 'upload', 'map', 'match', 'signed'].includes(parsed.stage)) throw new Error('This is not a Settlement Match workspace export.')
    state = parsed
    state.updatedAt = new Date().toISOString()
    await persist()
    announce('The workspace was imported and saved on this device.')
  } catch (caught) {
    error = caught instanceof Error ? caught.message : 'That workspace file could not be imported.'
  }
  render()
}

function download(name: string, content: string, type: string): void {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([content], { type }))
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

function exportData(): void {
  download(`settlement-match-workspace-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(state, null, 2), 'application/json')
  announce('A local workspace copy was exported.'); render()
}

function exportReport(): void {
  const data = currentData(); if (!data) return
  const { result } = data
  const rows = result.selected.map((sale) => [sale.id, sale.date, sale.status, sale.gross.toFixed(2), sale.fee.toFixed(2), sale.refund.toFixed(2), 'Included'])
  rows.push(['SUMMARY', data.payout.date, state.signoff?.note ?? '', result.gross.toFixed(2), result.fees.toFixed(2), result.refunds.toFixed(2), `Variance ${result.variance.toFixed(2)}`])
  download(`${data.payout.id.replace(/[^a-z0-9-]/gi, '_')}-exception-report.csv`, rowsToCsv(['Reference', 'Date', 'Status / note', 'Gross', 'Fee', 'Refund', 'Decision'], rows), 'text/csv')
}

function downloadSamples(): void {
  download('sample-payout.csv', 'payout_id,payout_date,net_amount,fees,refunds\nPO-1042,2026-08-26,285.50,9.50,25.00\n', 'text/csv')
  setTimeout(() => download('sample-sales.csv', 'order_id,paid_date,gross_amount,processor_fee,refund_amount,status\nORD-100,2026-08-25,120.00,3.60,0,paid\nORD-101,2026-08-26,200.00,5.90,25.00,partially_refunded\n', 'text/csv'), 250)
}

window.addEventListener('online', render)
window.addEventListener('offline', render)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js').then((registration) => {
    if (registration.waiting) document.querySelector<HTMLElement>('#update-toast')!.hidden = false
    registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', () => {
      if (registration.waiting && navigator.serviceWorker.controller) document.querySelector<HTMLElement>('#update-toast')!.hidden = false
    }))
  }).catch(() => { /* the app remains fully usable without installation */ }))
}
