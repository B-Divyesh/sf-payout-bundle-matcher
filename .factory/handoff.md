# Settlement Match — build handoff

## Shipped

- A complete local CSV reconciliation flow: import a processor payout export
  and sales/invoice export, confirm every suggested mapping, choose a payout,
  adjust the settlement lookback window, include/exclude rows, and see the
  deterministic gross − fees − refunds = expected proceeds calculation.
- Timing shifts are labeled per row; remaining variance is presented as an
  exception rather than hidden. Both per-sale and payout-level fee/refund
  exports are supported.
- Reviewer sign-off with name, timestamp, report ID, required variance note,
  browser print/PDF report, and exception CSV containing both included and
  excluded transactions.
- IndexedDB persistence, workspace JSON export/import, explicit local deletion,
  offline state, install manifest/icons, versioned service-worker caches,
  navigation fallback, and update-ready toast.
- A genuinely useful free tier. The $19 one-time Pro license uses the Sociobot
  hosted checkout/verify contract and adds reusable local column maps plus
  unbranded print reports. License restore and once-daily verification are
  implemented without blocking the free first paint.
- Original surreal editorial hero art, optimized from 2.5 MB PNG source to a
  52 KB WebP. Prompt, model/deployment, review, and license provenance are in
  `.factory/design.md` and `assets/src/settlement-landscape*.json`.
- Responsive 390 px layout, keyboard focus treatment, reduced-motion fallback,
  semantic landmarks, one h1, labeled controls/table, live error/status copy,
  legal pages, and no runtime third-party scripts, fonts, analytics, or bank
  connections.

## Run and verify

```sh
npm install
npm test
npm run build
npm run preview
```

Deployment command: `npm run build`

Deployment directory: `dist/` (`dist/index.html` is at the root).

Verification on 2026-08-27 against the local production preview:

- `npm test`: 2 files, 9 tests passed.
- `npm run build`: passed; initial assets are 29.90 KB JS / 10.20 KB gzip,
  17.64 KB CSS / 5.10 KB gzip, and 52 KB hero WebP.
- Factory `verify-url.sh`: HTTP 200, title/lang/main/alt checks passed, one h1,
  zero missing image alts, zero unlabeled buttons, zero console/page errors.
- Playwright 390 × 844 end-to-end: sample upload → confirmed mapping → two-row
  match → $0.00 variance → sign-off → refresh persistence → offline refresh;
  passed with no document-level horizontal overflow.
- Playwright + axe-core: zero violations on the empty workspace and the signed
  matched workspace (therefore zero serious/critical violations).
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; LCP 1.4 s, CLS 0, total blocking time 10 ms. Lab Lighthouse does not
  produce INP without field interaction data.
- Privacy and terms static routes, manifest, app icons, robots file, sitemap,
  and service-worker shell assets are present in `dist/`.

The reproducible browser journey is `.factory/evidence/e2e.mjs`; start the
preview server first. It uses `CHROME_PATH` when supplied, otherwise the worker
image's Playwright Chromium path.

## Known gaps / next steps

- The factory still needs to register the production product in Sociobot. The
  checkout/verify URLs intentionally contain only the slug; a real paid card
  journey could not be completed before that registration.
- Matching is deliberately explainable: it suggests non-void sales from the
  selected date window, then requires a person to approve rows. It does not
  infer processor-specific payout IDs from undocumented metadata or solve
  arbitrary subset sums.
- v1 accepts comma-delimited CSV up to 10 MB. Locale-specific semicolon files
  should be re-exported as standard CSV, and ambiguous dates should be exported
  as ISO dates.
- Print/PDF output uses the browser print dialog; browsers may add their own
  page header/footer unless the user disables that print option.
