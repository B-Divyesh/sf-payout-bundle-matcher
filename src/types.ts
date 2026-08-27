export type CsvRow = Record<string, string>

export type PayoutMapping = {
  id: string
  date: string
  amount: string
  gross: string
  fee: string
  refund: string
}

export type SalesMapping = {
  id: string
  date: string
  gross: string
  fee: string
  refund: string
  status: string
}

export type Mapping = {
  payout: PayoutMapping
  sales: SalesMapping
}

export type ImportedFile = {
  name: string
  headers: string[]
  rows: CsvRow[]
}

export type Sale = {
  key: string
  id: string
  date: string
  gross: number
  fee: number
  refund: number
  status: string
}

export type Payout = {
  key: string
  id: string
  date: string
  amount: number
  gross?: number
  fee?: number
  refund?: number
}

export type Reconciliation = {
  selected: Sale[]
  excluded: Sale[]
  gross: number
  fees: number
  refunds: number
  expected: number
  payout: number
  variance: number
  timingShiftCount: number
}

export type AppState = {
  version: 1
  stage: 'welcome' | 'upload' | 'map' | 'match' | 'signed'
  payoutFile?: ImportedFile
  salesFile?: ImportedFile
  mapping?: Mapping
  payoutRow: number
  selectedKeys: string[]
  timingDays: number
  currency: string
  signoff?: { name: string; note: string; at: string; reportId: string }
  updatedAt: string
}
