import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const config = JSON.parse(readFileSync(new URL('../public/staticwebapp.config.json', import.meta.url), 'utf8')) as {
  globalHeaders: Record<string, string>
  mimeTypes: Record<string, string>
  routes: Array<{ route: string; headers: Record<string, string> }>
}

describe('static deployment response policy', () => {
  it('keeps hashed assets immutable and hardens application responses', () => {
    expect(config.routes.find((route) => route.route === '/assets/*')?.headers['Cache-Control'])
      .toBe('public, max-age=31536000, immutable')
    expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json')
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'")
    expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()')
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY')
  })
})
