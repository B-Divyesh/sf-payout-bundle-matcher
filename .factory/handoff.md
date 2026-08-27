# Settlement Match — repair handoff: PASS locally, live deployment pending

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

## Deploy and live verification

The deployment class remains static `pwa-offline`. Deploy from the repository
root with:

```sh
/opt/fleet/lib/deploy-static.sh payout-bundle-matcher dist
```

Live URL, byte-identity, response-policy, service-worker/offline, and browser
verification evidence will be appended after the configured deployment
completes.

## Known gaps

None in the repaired free/local-first workflow. The optional $19 Pro checkout
still depends on the factory’s registered Sociobot product; it does not gate
matching, data export, deletion, or accessibility.
