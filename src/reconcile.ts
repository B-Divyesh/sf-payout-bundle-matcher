import type { CsvRow, Mapping, Payout, Reconciliation, Sale } from './types'

export function parseMoney(raw: string): number {
  if (!raw?.trim()) return 0
  let valueText = raw.trim()
  let negative = false
  if (valueText.startsWith('(') || valueText.endsWith(')')) {
    if (!/^\([^()]+\)$/.test(valueText)) throw new Error(`“${raw}” is not a valid money amount.`)
    negative = true
    valueText = valueText.slice(1, -1).trim()
  }

  // A CSV may contain a currency symbol/code and thousands separators, but it
  // must still be one complete decimal value. In particular, parseFloat would
  // silently turn a damaged "12.34.56" into $12.34.
  valueText = valueText.replace(/^(?:[A-Za-z]{3}|[$€£¥₹])\s*|\s*(?:[A-Za-z]{3}|[$€£¥₹])$/g, '').trim()
  const match = valueText.match(/^(?<sign>[+-]?)(?:(?:\d{1,3}(?:,\d{3})+)|\d+)(?:\.\d{1,2})?$/)
  if (!match || (negative && match.groups?.sign)) throw new Error(`“${raw}” is not a valid money amount.`)
  const value = Number(match[0].replaceAll(',', ''))
  if (!Number.isFinite(value)) throw new Error(`“${raw}” is not a valid money amount.`)
  return Math.round((negative ? -value : value) * 100) / 100
}

export function parseDate(raw: string): string {
  const value = raw?.trim()
  if (!value) throw new Error('A mapped date is blank.')
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})(.*)$/)
  if (iso) {
    const [, year, month, day, suffix] = iso
    validateCalendarDate(year, month, day, raw)
    if (!suffix) return `${year}-${month}-${day}`
    if (/^T/.test(suffix)) {
      const instant = new Date(value)
      if (!Number.isNaN(instant.valueOf())) return instant.toISOString().slice(0, 10)
    }
  }
  const us = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (us) {
    const [, month, day, year] = us
    validateCalendarDate(year, month, day, raw)
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  throw new Error(`“${raw}” is not a date this browser recognizes.`)
}

function validateCalendarDate(yearText: string, monthText: string, dayText: string, raw: string): void {
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new Error(`“${raw}” is not a real calendar date.`)
  }
}

export function toPayout(row: CsvRow, index: number, mapping: Mapping['payout']): Payout {
  return {
    key: `payout-${index}`,
    id: row[mapping.id]?.trim() || `Payout ${index + 1}`,
    date: parseDate(row[mapping.date]),
    amount: parseMoney(row[mapping.amount]),
    gross: mapping.gross ? parseMoney(row[mapping.gross]) : undefined,
    fee: mapping.fee ? Math.abs(parseMoney(row[mapping.fee])) : undefined,
    refund: mapping.refund ? Math.abs(parseMoney(row[mapping.refund])) : undefined
  }
}

export function toSales(rows: CsvRow[], mapping: Mapping['sales']): Sale[] {
  return rows.map((row, index) => ({
    key: `sale-${index}`,
    id: row[mapping.id]?.trim() || `Sale ${index + 1}`,
    date: parseDate(row[mapping.date]),
    gross: parseMoney(row[mapping.gross]),
    fee: mapping.fee ? Math.abs(parseMoney(row[mapping.fee])) : 0,
    refund: mapping.refund ? Math.abs(parseMoney(row[mapping.refund])) : 0,
    status: mapping.status ? row[mapping.status]?.trim() || '—' : '—'
  }))
}

export function suggestedKeys(sales: Sale[], payout: Payout, timingDays: number): string[] {
  const payoutTime = Date.parse(`${payout.date}T00:00:00Z`)
  return sales.filter((sale) => {
    const days = (payoutTime - Date.parse(`${sale.date}T00:00:00Z`)) / 86_400_000
    return days >= 0 && days <= timingDays && !/void|cancel/i.test(sale.status)
  }).map((sale) => sale.key)
}

export function reconcile(sales: Sale[], selectedKeys: string[], payout: Payout): Reconciliation {
  const keys = new Set(selectedKeys)
  const selected = sales.filter((sale) => keys.has(sale.key))
  const excluded = sales.filter((sale) => !keys.has(sale.key))
  const gross = round(selected.reduce((sum, sale) => sum + sale.gross, 0))
  const rowFees = round(selected.reduce((sum, sale) => sum + sale.fee, 0))
  const rowRefunds = round(selected.reduce((sum, sale) => sum + sale.refund, 0))
  const fees = rowFees || payout.fee || 0
  const refunds = rowRefunds || payout.refund || 0
  const expected = round(gross - fees - refunds)
  return {
    selected,
    excluded,
    gross,
    fees,
    refunds,
    expected,
    payout: payout.amount,
    variance: round(payout.amount - expected),
    timingShiftCount: selected.filter((sale) => sale.date !== payout.date).length
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
