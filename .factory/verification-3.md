# Independent verification 3 — PASS

**Candidate:** `21e88a9504fe53286e607cb200f0099a00789618`  
**Repository:** `B-Divyesh/sf-payout-bundle-matcher`, branch `main`  
**Live target:** <https://payout-bundle-matcher.sociobot.in/>  
**Verified:** 2026-08-27 (fresh checkout)

## Verdict

**PASS.** Settlement Match satisfies the researched smallest useful product:
a one-payout, local CSV reconciliation tool that makes gross sales, fees,
refunds, timing shifts, selection, variance, sign-off, and export explicit.
The former deployment-only concern is not present in fresh evidence. The live
site is byte-identical to the candidate build and its service-worker update
activates correctly.

## Reproducible quality gates

```sh
npm ci
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
npm run test:browser
BASE_URL=https://payout-bundle-matcher.sociobot.in npm run test:browser
node .factory/evidence/independent-verification-3.mjs
BASE_URL=https://payout-bundle-matcher.sociobot.in \
  node .factory/evidence/independent-verification-3.mjs
```

- `npm ci`: succeeded; 59 packages audited, 0 vulnerabilities.
- `npm test`: 4 files / 15 assertions passed. There is no separate lint
  command; `npm run build` runs the repository's TypeScript check
  (`tsc --noEmit`) before Vite.
- Exact production build succeeded and created `dist/`.
- Production entry assets are 30,769 B JavaScript (10,590 B gzip), 17,862 B
  CSS (5,130 B gzip), and a 52,226 B WebP hero; all are within the stipulated
  200 KB JS, 50 KB CSS, and 300 KB hero budgets.

## Product and recovery journeys

The supplied production browser journey passed locally and at the live URL.
It imported representative processor and sales CSVs, confirmed mapping,
selected the two applicable non-void transactions, explained the payout at
`$0.00` variance, signed it off, persisted it across reload, and reloaded it
while offline at 390 × 844.

The additional independent journey in
`.factory/evidence/independent-verification-3.mjs` also passed locally and
live:

- A one-row `$100.00` payout / `$80.00` sale produces the expected `$20.00`
  exception. The mapped leap date `2024-02-29` is accepted.
- A header-only CSV gives a specific, recoverable error; replacing it with a
  valid CSV proceeds normally. Existing browser coverage also confirms invalid
  `2026-02-30` and malformed money `12.34.56` remain on the mapping screen
  with exact corrective errors.
- A remaining variance requires an exception note before sign-off. After
  sign-off, exception CSV export succeeds and an order reference beginning
  `=INJECT` is emitted as spreadsheet-safe text.
- Deletion requires its second explicit confirmation, reports its result, and
  leaves the empty workspace after reload.
- The free core, exports, deletion, and accessibility remain available. The
  Pro dialog's checkout link is exactly
  `https://api.sociobot.in/api/v1/products/payout-bundle-matcher/checkout`;
  no checkout was attempted because it is an external paid transaction.

## PWA, accessibility, responsive, and visual checks

- Manifest includes standalone display, versioned start URL, token-matched
  colors, and 192/512 icons including a maskable icon.
- At 390 px the normal flow's first-paint samples were all free of document
  overflow; settled mobile and 1280 px desktop were also free of document
  overflow. The intentionally wide transaction table remains contained in its
  horizontal scroller. Manual inspection of the recorded desktop/mobile
  screenshots found the designed editorial layout legible and appropriately
  stacked at both sizes.
- Keyboard Tab reaches the skip link, which reveals with its designed 3 px
  focus outline; Enter moves to the matching tool. The normal journey operates
  its controls with native keyboard semantics.
- Reduced-motion rendering reports the 0.01 ms override (`1e-05s` in Chromium)
  and has no mobile document overflow.
- Axe found zero violations on welcome, reconciled, and privacy pages; zero
  serious/critical findings. The test recorded no console errors or page
  errors.
- Offline reload was explicitly tested after service-worker control. The
  isolated update test serves an installed worker, changes the worker version,
  clicks **Update now**, observes controller replacement/navigation, and finds
  `settlement-match-update-b-shell`.

## Deployment, privacy, and policies

- SHA-256 comparison of every 15 public `dist` artifacts versus the live URL
  found **0 mismatches**. `staticwebapp.config.json` is deployment
  configuration rather than a public artifact.
- A fresh live initial navigation made no cross-origin requests, no analytics,
  no bank/upload/API call, and loaded no remote font or script. The sole
  possible external endpoint in the product is the optional user-license
  verifier allowed by CSP.
- Live responses provide CSP (`default-src 'self'`; explicit Sociobot API
  connect allow-list; `frame-ancestors 'none'`), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, strict referrer policy, HSTS, and a
  restrictive Permissions-Policy. The hashed JS has
  `public, max-age=31536000, immutable`; manifest is correctly
  `application/manifest+json` with `no-cache`; `sw.js` has
  `no-cache, no-store, must-revalidate`.
- Live mobile Lighthouse: Performance **98**, Accessibility **100**, Best
  Practices **100**, SEO **100**; LCP 1.2 s, CLS 0, TBT 170 ms, 94 KiB total
  transfer. Raw evidence is ignored at
  `.factory/evidence/verification-3-lighthouse.json`.

## Defects

No critical, high, medium, or low defects found in scope.

The brief's pilot adoption/time-reduction targets require real user study and
are product-outcome metrics, not properties that can be established by a
pre-release browser test.
