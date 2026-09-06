export const PRODUCT_SLUG = 'payout-bundle-matcher'
const API = 'https://api.sociobot.in/api/v1'
const KEY = `sb_license:${PRODUCT_SLUG}`
const VERDICT_KEY = `${KEY}:verdict`

type Verdict = { valid: boolean; checkedAt: number }

export function captureLicense(): void {
  const url = new URL(location.href)
  const token = url.searchParams.get('license')
  if (!token) return
  localStorage.setItem(KEY, token)
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: true, checkedAt: 0 }))
  url.searchParams.delete('license')
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

export function storeLicense(token: string): void {
  localStorage.setItem(KEY, token.trim())
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: true, checkedAt: 0 }))
}

export function hasOptimisticLicense(): boolean {
  if (!localStorage.getItem(KEY)) return false
  try {
    const verdict = JSON.parse(localStorage.getItem(VERDICT_KEY) || '{}') as Verdict
    return verdict.valid !== false
  } catch {
    return true
  }
}

export async function verifyLicense(force = false): Promise<boolean> {
  const token = localStorage.getItem(KEY)
  if (!token) return false
  try {
    const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) || '{}') as Verdict
    if (!force && cached.checkedAt && Date.now() - cached.checkedAt < 86_400_000) return cached.valid
  } catch { /* verify malformed cache */ }
  try {
    const response = await fetch(`${API}/products/${PRODUCT_SLUG}/verify?license=${encodeURIComponent(token)}`)
    if (!response.ok) throw new Error('Verification unavailable')
    const result = await response.json() as { valid: boolean }
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, checkedAt: Date.now() }))
    return result.valid
  } catch {
    return hasOptimisticLicense()
  }
}
