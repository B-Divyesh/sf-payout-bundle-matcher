import { describe, expect, it } from 'vitest'
import { parseDate, parseMoney, reconcile, suggestedKeys, toPayout, toSales } from './reconcile'
import type { Mapping } from './types'

const mapping: Mapping = {
  payout: { id: 'id', date: 'date', amount: 'net', gross: '', fee: 'fee', refund: 'refund' },
  sales: { id: 'id', date: 'date', gross: 'gross', fee: 'fee', refund: 'refund', status: 'status' }
}

describe('money and date normalization', () => {
  it('accepts currency formatting and accounting negatives', () => {
    expect(parseMoney('$1,234.50')).toBe(1234.5)
    expect(parseMoney('(25.20)')).toBe(-25.2)
    expect(() => parseMoney('not money')).toThrow('not a valid money')
  })

  it('rejects malformed money instead of accepting a numeric prefix', () => {
    expect(() => parseMoney('12.34.56')).toThrow('not a valid money')
    expect(() => parseMoney('1,23.45')).toThrow('not a valid money')
    expect(() => parseMoney('12.345')).toThrow('not a valid money')
  })

  it('normalizes ISO and US export dates', () => {
    expect(parseDate('2026-08-26T14:30:00Z')).toBe('2026-08-26')
    expect(parseDate('08/25/2026')).toBe('2026-08-25')
  })

  it('rejects impossible calendar dates before matching', () => {
    expect(() => parseDate('2026-02-30')).toThrow('not a real calendar date')
    expect(() => parseDate('02/29/2025')).toThrow('not a real calendar date')
  })
})

describe('deterministic payout reconciliation', () => {
  const payout = toPayout({ id: 'PO-1', date: '2026-08-26', net: '285.50', fee: '9.50', refund: '25' }, 0, mapping.payout)
  const sales = toSales([
    { id: 'A', date: '2026-08-25', gross: '120', fee: '3.60', refund: '0', status: 'paid' },
    { id: 'B', date: '2026-08-26', gross: '200', fee: '5.90', refund: '25', status: 'partially_refunded' },
    { id: 'C', date: '2026-08-20', gross: '50', fee: '1', refund: '0', status: 'paid' },
    { id: 'D', date: '2026-08-26', gross: '99', fee: '0', refund: '0', status: 'void' }
  ], mapping.sales)

  it('suggests only non-void transactions inside the lookback window', () => {
    expect(suggestedKeys(sales, payout, 3)).toEqual(['sale-0', 'sale-1'])
  })

  it('explains the deposit and counts timing shifts', () => {
    const result = reconcile(sales, ['sale-0', 'sale-1'], payout)
    expect(result).toMatchObject({ gross: 320, fees: 9.5, refunds: 25, expected: 285.5, payout: 285.5, variance: 0, timingShiftCount: 1 })
  })

  it('uses payout-level fees when the sales export has none', () => {
    const salesWithoutDetails = sales.slice(0, 2).map((sale) => ({ ...sale, fee: 0, refund: 0 }))
    const result = reconcile(salesWithoutDetails, ['sale-0', 'sale-1'], payout)
    expect(result.fees).toBe(9.5)
    expect(result.refunds).toBe(25)
    expect(result.variance).toBe(0)
  })
})
