# Settlement Match — repair handoff

## Scope

This repair addresses every finding in independent verifier report
`.factory/verification-1.md` (recorded by commit
`56f111bf48929023bdd30495a8a6fcf980aa4321`) while retaining the existing
local-first CSV reconciliation, persistence, import/export/deletion, paid
license, PWA, legal routes, and original editorial visual system.

## Repaired

- **FIN-01:** Dates are now parsed only from supported ISO or US export forms,
  with calendar fields validated before conversion. Impossible values such as
  `2026-02-30` and `02/29/2025` produce a recoverable mapping error; JavaScript
  can no longer normalize them into different evidence.
- **FIN-02:** Money parsing now requires one complete conventional decimal
  value after an optional currency symbol/code and valid thousands grouping.
  `12.34.56`, bad grouping, and more than two decimal places are rejected
  rather than truncated by `parseFloat`.
- **A11Y-01:** Excluded rows retain full text opacity and use a readable warm
  surface plus strike-through, preserving the evidence distinction without
  lowering contrast.
- **SEC-01:** CSV export prefixes source cells beginning `=`, `+`, `-`, or
  `@` with a spreadsheet text apostrophe, preventing formula execution while
  preserving the displayed source value.
- **MOB-01:** The hero’s decorative disc now stays inside the figure’s right
  edge, eliminating document-level overflow at 390 px. The intentionally wide
  transaction table remains the only horizontal scroller.
- **DEP-01 / DEP-02:** `public/staticwebapp.config.json` ships with the static
  artifact. It makes `/assets/*` immutable for one year, gives the manifest
  `application/manifest+json`, keeps the service worker revalidated, and adds
  CSP, `frame-ancestors`, X-Frame-Options, Permissions-Policy, nosniff, and
  strict referrer policy. The CSP permits only this origin, the inline data-URI
  texture, blob downloads, and the optional Sociobot license verifier.
- The service-worker cache namespace is now `settlement-match-v2`, so an
  installed prior version gets a clean updated shell on activation.

## Regression coverage

- Unit tests cover impossible calendar dates, malformed money formats,
  spreadsheet formula neutralization, and the static-host cache/header/MIME
  contract (`13` tests across `3` files).
- `.factory/evidence/e2e.mjs` covers a normal signed reconciliation with an
  excluded void row, desktop and 390 × 844 layouts, keyboard Tab/Enter on the
  skip link, axe scans of empty and matched states, the exact FIN-01 and
  FIN-02 input pairs, persistence, service-worker control, and offline reload.

## Run and verify

```sh
npm ci
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
node .factory/evidence/e2e.mjs
```

Current local production verification (2026-08-27):

- `npm ci`: 58 packages audited, 0 vulnerabilities.
- `npm test`: 3 files / 13 tests passed.
- `npm run build`: passed (`tsc --noEmit && vite build`), producing `dist/`.
  Initial application assets are 30.58 KB JS (10.51 KB gzip), 17.74 KB CSS
  (5.11 KB gzip), and 52.23 KB WebP hero artwork.
- Playwright browser evidence: `$0.00` normal variance with two selected rows;
  invalid date and money each show an error and remain on the mapping form;
  no 390 px or desktop document overflow; skip link reached by keyboard;
  service worker controls the page; signed state survives refresh and offline
  reload; no page/console errors; axe has zero violations in the empty and
  representative excluded-row matched states.
- Lighthouse mobile production-preview: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; LCP 1.3 s, CLS 0, TBT 0 ms. The JSON evidence
  is `.factory/evidence/lighthouse.json`.
- Privacy check: no production runtime dependencies; initial app paths use
  only first-party assets. Source review finds no analytics, upload endpoint,
  third-party font, or tracking request. The optional user-initiated license
  verification is the sole external call (`api.sociobot.in`).
- Static response configuration is unit-tested and present in `dist/`. Live
  response headers and asset identity are verified after deployment below.

## Deploy

Deployment class remains `pwa-offline` static hosting. Build from the repository
root and deploy `dist/`:

```sh
npm ci && npm test && npm run build
/opt/fleet/lib/deploy-static.sh payout-bundle-matcher dist
```

## Live deployment verification

Deployed 2026-08-27 with Azure Static Web Apps deployment
`a7f8a21e-477b-44e5-8717-3b6464f9c1e5` to
`https://payout-bundle-matcher.sociobot.in/`.

- The complete live browser regression, including the exact invalid-date and
  invalid-money cases, passed with the same zero axe violations, no console
  errors, service-worker control, and offline reload as local preview.
- SHA-256 comparison matched all 15 public files in `dist/` against the live
  deployment. Azure consumes `staticwebapp.config.json` as configuration and
  intentionally does not serve it as a public file.
- Live `/assets/app-BHChZpk2.js` returns
  `Cache-Control: public, max-age=31536000, immutable`; the manifest returns
  `Content-Type: application/manifest+json` and `Cache-Control: no-cache`; the
  worker returns `Cache-Control: no-cache, no-store, must-revalidate`.
- The live HTML includes the configured CSP (including `frame-ancestors
  'none'`), `Permissions-Policy`, `X-Frame-Options: DENY`, nosniff, strict
  referrer policy, and the host’s existing HSTS policy.

## Known external dependency

The optional $19 Pro checkout still depends on the factory registering the
production Sociobot product. Free reconciliation, all user data export, and
the privacy-preserving local workflow are fully usable without it.
