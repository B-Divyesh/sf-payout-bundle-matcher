import type { CsvRow, ImportedFile } from './types'

export function parseCsv(text: string, name = 'file.csv'): ImportedFile {
  const input = text.replace(/^\uFEFF/, '')
  const matrix: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field.trim())
      field = ''
    } else if (char === '\n') {
      row.push(field.trim())
      if (row.some(Boolean)) matrix.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }
  if (quoted) throw new Error('A quoted field is not closed. Export the CSV again and retry.')
  row.push(field.trim())
  if (row.some(Boolean)) matrix.push(row)
  if (matrix.length < 2) throw new Error('This CSV needs a header row and at least one data row.')

  const headers = matrix[0].map((header, index) => header || `Column ${index + 1}`)
  const duplicate = headers.find((header, index) => headers.indexOf(header) !== index)
  if (duplicate) throw new Error(`The column name “${duplicate}” appears more than once.`)

  const rows: CsvRow[] = matrix.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
  )
  return { name, headers, rows }
}

export function csvEscape(value: string | number): string {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function rowsToCsv(headers: string[], rows: Array<Array<string | number>>): string {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
}

export function guessColumn(headers: string[], terms: string[], optional = false): string {
  const normalized = headers.map((header) => header.toLowerCase().replace(/[^a-z0-9]/g, ''))
  for (const term of terms) {
    const exact = normalized.findIndex((header) => header === term)
    if (exact >= 0) return headers[exact]
  }
  for (const term of terms) {
    const partial = normalized.findIndex((header) => header.includes(term))
    if (partial >= 0) return headers[partial]
  }
  return optional ? '' : headers[0] ?? ''
}
