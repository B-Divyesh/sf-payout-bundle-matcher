import type { CsvRow, Mapping, Payout, Reconciliation, Sale } from './types'

export function parseMoney(raw: string): number {
  if (!raw?.trim()) return 0
  const negative = /^\s*\(.*\)\s*$/.test(raw)
  const cleaned = raw.replace(/[^0-9.,+-]/g, '').replaceAll(',', '').replace(/[()]/g, '')
  const value = Number.parseFloat(cleaned)
  if (!Number.isFinite(value)) throw new Error(`“${raw}” is not a valid money amount.`)
  return Math.round((negative ? -value : value) * 100) / 100
}

export function parseDate(raw: string): string {
  const value = raw?.trim()
  if (!value) throw new Error('A mapped date is blank.')
  const direct = new Date(value)
  if (!Number.isNaN(direct.valueOf())) return direct.toISOString().slice(0, 10)
  const match = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (match) {
    const parsed = new Date(Date.UTC(Number(match[3]), Number(match[1]) - 1, Number(match[2])))
    if (!Number.isNaN(parsed.valueOf())) return parsed.toISOString().slice(0, 10)
  }
  throw new Error(`“${raw}” is not a date this browser recognizes.`)
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
