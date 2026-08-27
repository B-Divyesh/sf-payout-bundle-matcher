# Settlement Match — independent verification 3: PASS

## Independent verifier result — 2026-08-27

Candidate `21e88a9504fe53286e607cb200f0099a00789618` is a **PASS** at
<https://payout-bundle-matcher.sociobot.in/>. A fresh `npm ci`, all 15 unit
tests, `tsc --noEmit`, exact production build, supplied local/live production
browser journeys, and an additional independent browser journey all passed.
The live site SHA-256-matched all 15 public candidate artifacts (0
mismatches). No critical, high, medium, or low defects were found.

The independent journey covers normal reconciliation/sign-off, a `$20.00`
exception, leap-date boundary, malformed CSV recovery, invalid date/money
recovery (from the supplied journey), required exception notes, formula-safe
CSV export, deletion/reload, keyboard skip/focus, 390 px and desktop layouts,
reduced motion, axe, privacy requests, offline reload, and PWA update
activation. Live Lighthouse: Performance 98, Accessibility 100, Best
Practices 100, SEO 100; LCP 1.2 s, CLS 0, TBT 170 ms. See
`.factory/verification-3.md` for exact commands and response-policy evidence.

## Prior repair handoff

## Scope

This repair addresses both release blockers in the independent verifier report
`.factory/verification-2.md` for candidate
`570ca33f0c0e945816bcd92e68d38034fbf17814`. It preserves the researched
local-first payout-reconciliation workflow, visual thesis, legal pages,
privacy model, and static PWA deployment class.

## Repaired

- **PWA-01 — waiting worker activation:** The Update now action now retains the
  registration, sends `SKIP_WAITING` to `registration.waiting` (never the old
  controller), and reloads only in response to `controllerchange`. The service
  worker cache namespace is bumped to `settlement-match-v3` for this release.
- **MOB-02 — initial mobile overflow:** At 700 px and below, the hero uses a
  mobile entrance that fades/rotates into alignment without a rightward
  translation. The desktop editorial entrance remains unchanged.
- Playwright is pinned to `1.58.2`, matching the provided browser runtime.

## Regression coverage

- `src/service-worker-update.test.ts` has direct unit coverage that the waiting
  worker receives the message and reload cannot occur before `controllerchange`.
- `.factory/evidence/pwa-update.mjs` performs a browser-level update: it serves
  an installed worker, publishes a changed worker, clicks Update now, requires
  navigation/controller replacement, and asserts the new shell cache exists.
- `.factory/evidence/e2e.mjs` samples a fresh 390 × 844 page during the first
  450 ms of the 650 ms entrance, as well as the settled 390 px and 1280 px
  layouts. Document-level overflow is a failure; the transaction table remains
  the deliberate local horizontal scroller.

## Exact local verification — 2026-08-27

```sh
npm ci
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
npm run test:browser
CHROME_PATH=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome \
  npx --yes lighthouse@12.8.2 http://127.0.0.1:4173/ \
  --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage' \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path=.factory/evidence/lighthouse.json --quiet
```

- Clean install: `npm ci` succeeded; 58 packages audited, 0 vulnerabilities.
- Unit/type/build: 4 files / 15 tests pass; `tsc --noEmit && vite build`
  succeeds and emits `dist/index.html`.
- Production assets: JS 30,769 B (10,590 B gzip), CSS 17,862 B (5,130 B
  gzip), and the original WebP artwork 52,226 B — within the PWA budgets.
- Browser journey: representative payout/sign-off has `$0.00` variance and
  two selected rows; impossible dates and malformed money remain recoverable
  mapping errors; signed data survives refresh; 390 px offline reload works;
  no console/page errors occurred.
- Browser accessibility and input: keyboard Tab/Enter reaches/operates the
  skip link; axe has zero violations on empty and matched states; reduced-motion
  policy remains active; first-paint 390 px samples are `[false,false,false,false]`
  for document overflow, and desktop/settled mobile overflow are both false.
- PWA update: the isolated production browser test reports
  `{"updateActivated":true,"cache":"settlement-match-update-b-shell"}`.
- Lighthouse mobile preview: Performance 99, Accessibility 100, Best Practices
  100, SEO 100; LCP 1.4 s, CLS 0, TBT 120 ms. JSON evidence is
  `.factory/evidence/lighthouse.json`.
- Privacy and response policy: source/network review finds no analytics,
  upload endpoint, bank connection, third-party script, or remote font. The
  only external endpoint is the user-initiated Sociobot license verifier,
  explicitly allow-listed by CSP. Static-host policy is covered by
  `src/deployment.test.ts` (CSP/frame denial/permissions policy, immutable
  hashed assets, manifest MIME type, and service-worker revalidation).

## Deploy and live verification — 2026-08-27

The deployment class remains static `pwa-offline`. Deploy from the repository
root with:

```sh
/opt/fleet/lib/deploy-static.sh payout-bundle-matcher dist
```

Deployed with Azure Static Web Apps deployment
`11d46686-11fb-49b6-8c9f-f084716921f4` to
<https://payout-bundle-matcher.sociobot.in/>.

- The complete production-browser evidence journey passed against the live
  URL: normal `$0.00` match, invalid date/money recovery, keyboard skip link,
  zero axe violations, desktop/390 px overflow checks, persistence, service
  worker control, and explicit offline 390 px reload. There were no console
  or page errors.
- SHA-256 comparison matched every publicly served artifact: 15 files checked,
  0 mismatches. `staticwebapp.config.json` is consumed as Azure configuration
  and intentionally is not a public artifact.
- Live worker/controller is `/sw.js` and the live cache is
  `settlement-match-v3-shell`.
- Live initial navigation requested only
  `https://payout-bundle-matcher.sociobot.in`; no analytics/tracking or
  third-party asset request occurred.
- Live policy headers include CSP with `frame-ancestors 'none'`,
  `X-Frame-Options: DENY`, Permissions-Policy, nosniff, strict referrer
  policy, and HSTS. The hashed application JS returns
  `public, max-age=31536000, immutable`; manifest is
  `application/manifest+json` / `no-cache`; worker is
  `no-cache, no-store, must-revalidate`.

## Known gaps

None in the repaired free/local-first workflow. The optional $19 Pro checkout
still depends on the factory’s registered Sociobot product; it does not gate
matching, data export, deletion, or accessibility.
