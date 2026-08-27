import { describe, expect, it } from 'vitest'
import { guessColumn, parseCsv, rowsToCsv } from './csv'

describe('CSV handling', () => {
  it('parses quoted commas, escaped quotes, CRLF, and blank cells', () => {
    const file = parseCsv('id,note,amount\r\nA1,"Fee, net of ""tax""",12.40\r\nA2,,4\r\n', 'sales.csv')
    expect(file.headers).toEqual(['id', 'note', 'amount'])
    expect(file.rows).toEqual([
      { id: 'A1', note: 'Fee, net of "tax"', amount: '12.40' },
      { id: 'A2', note: '', amount: '4' }
    ])
  })

  it('rejects malformed and ambiguous files', () => {
    expect(() => parseCsv('id,id\n1,2')).toThrow('appears more than once')
    expect(() => parseCsv('id,note\n1,"open')).toThrow('not closed')
    expect(() => parseCsv('id\n')).toThrow('at least one data row')
  })

  it('finds likely columns without making optional fields required', () => {
    const headers = ['Order number', 'Paid Date', 'Gross Amount']
    expect(guessColumn(headers, ['paiddate', 'date'])).toBe('Paid Date')
    expect(guessColumn(headers, ['refund'], true)).toBe('')
  })

  it('exports valid escaped CSV', () => {
    expect(rowsToCsv(['id', 'note'], [['A1', 'needs, review'], ['A2', 'said "ok"']]))
      .toBe('id,note\nA1,"needs, review"\nA2,"said ""ok"""')
  })

  it('neutralizes spreadsheet formulas in exported source cells', () => {
    expect(rowsToCsv(['reference'], [['=1+1'], ['+SUM(A1:A2)'], ['-42'], ['@lookup']]))
      .toBe("reference\n'=1+1\n'+SUM(A1:A2)\n'-42\n'@lookup")
  })
})
