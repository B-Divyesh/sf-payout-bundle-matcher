# Independent verification — FAIL

**Candidate:** `46e6d4a45e29547497c6b689b7c13d05c2d7f4c9`  
**Live URL:** <https://payout-bundle-matcher.sociobot.in/>  
**Verified:** 2026-08-27, from a clean, unchanged checkout at that commit.

## Verdict

**FAIL.** The normal reconciliation flow works, but the candidate is not safe
enough for the brief's financial reconciliation job: impossible dates and
malformed monetary strings are silently converted into different valid values.
The matched view also has an axe **serious** contrast violation, which fails
the explicit accessibility acceptance gate.

## Reproducible checks

```sh
npm ci
npm test
npm run build
npm run preview -- --port 4173
node .factory/evidence/e2e.mjs
```

- `npm ci`: succeeded; 58 packages audited, 0 vulnerabilities.
- `npm test`: succeeded; 2 test files / 9 tests passed.
- `npm run build`: succeeded (`tsc --noEmit && vite build`) and produced
  `dist/`. There is no separate lint script; the configured type check is part
  of the build.
- Production payload: app JS 29,897 B (10,204 B gzip), CSS 17,642 B (5,104 B
  gzip), hero WebP 52,226 B; all are within the stated static budgets.
- The supplied Playwright journey passed locally: normal upload → mapping →
  two selected rows → `$0.00` variance → sign-off → refresh persistence →
  offline reload. No console or page errors were captured.
- Independent browser checks at desktop and 390 × 844 covered valid imports,
  zero-day boundary selection, void exclusion, exception-note requirement,
  quoted-CSV and obvious invalid-money rejection/recovery, report export,
  workspace export/import, local deletion, keyboard Tab/skip link, reduced
  motion, and offline reload.
- Live normal-flow tests produced the same behavior with no console/page
  errors. The initial unlicensed page requested only first-party static
  assets; source review finds no analytics, bank/upload endpoint, third-party
  font/script, or tracking request. The optional license verifier is the only
  code path that calls `https://api.sociobot.in/api/v1`.

## Live deployment identity and PWA

- Every file in locally built `dist/` was fetched from the live URL and had an
  identical SHA-256 digest, including `index.html`, hashed JS/CSS, service
  worker, manifest, legal pages, icons, artwork, and offline page.
- The live manifest and service worker register. The active controller was
  `https://payout-bundle-matcher.sociobot.in/sw.js`, cache
  `settlement-match-v1-shell` existed, and a 390 px offline reload retained
  the app shell, offline notice, and saved workspace without errors.
- The worker has a versioned cache name, `clients.claim()`, and an update
  message path that calls `skipWaiting()`. A real changed-worker update cannot
  be induced against the immutable candidate deployment, so that handoff path
  was code-inspected rather than simulated with altered product assets.

## Defects

### High — FIN-01: impossible calendar dates are silently changed

Import this otherwise valid pair and confirm the suggested mapping:

```csv
# payout.csv
payout_id,payout_date,net_amount
P-1,2026-02-30,100

# sales.csv
order_id,paid_date,gross_amount
S-1,2026-03-02,100
```

Instead of rejecting the impossible `2026-02-30`, the product displays the
payout date as **Mar 2, 2026** and reports a `$0.00` variance. JavaScript's
date normalization has changed the evidence before matching. A financial
matcher must validate that parsed date parts round-trip exactly and show a
recoverable mapping/file error for impossible dates.

### High — FIN-02: malformed money is silently truncated

With `gross_amount` set to `12.34.56`, mapping confirmation succeeds and the
calculation reports selected gross sales of `$12.34`; it does not report an
error. This can create a false exception or false explanation from a damaged
CSV. Monetary parsing must require one complete valid numeric representation
after permitted currency/grouping normalization, rather than accepting the
numeric prefix.

### High — A11Y-01: serious color-contrast violations in matched transactions

`@axe-core/playwright` reports `color-contrast` with **serious** impact after
the representative import, for excluded/void rows. For example,
`.excluded > td:nth-child(3)` is rendered at 2.96:1 and its `.shift` label at
2.16:1 on `#fff9ef` (required 4.5:1). The stylesheet's `.excluded { opacity:
.48 }` dims meaningful review evidence below the required contrast. This
fails the requested zero-serious/critical axe gate.

### Medium — SEC-01: exported CSV allows spreadsheet formula injection

Import an order ID of `=1+1`, complete sign-off, then export the exception
CSV. Its second line begins:

```csv
=1+1,2026-08-26,—,100.00,0.00,0.00,Included
```

Opening the report in a spreadsheet can evaluate untrusted source data as a
formula. Neutralize values beginning with `=`, `+`, `-`, or `@` before export
(while preserving the source value safely for the report).

### Medium — MOB-01: 390 px matched view horizontally overflows

At 390 px, `document.documentElement.scrollWidth` is 409 px. The hero figure
extends to 398.7 px and produces page-level horizontal scrolling; the 760 px
transaction table is intentionally inside its own horizontal scroller. Keep
the decorative hero/pseudo-elements within the viewport so only the table
scrolls horizontally.

### Medium — DEP-01: live hashed assets lack immutable caching

Live HTML, hashed JS/CSS, service worker, and manifest all return
`Cache-Control: public, must-revalidate, max-age=30`. Hashed assets should be
long-lived immutable resources; this deployment policy needlessly revalidates
the app and does not meet the PWA caching guidance. The manifest is also
served as `application/octet-stream` rather than a manifest JSON MIME type.

### Low — DEP-02: response-policy hardening is incomplete

The live response has HSTS, `Referrer-Policy: strict-origin-when-cross-origin`
and `X-Content-Type-Options: nosniff`, but no Content-Security-Policy,
frame-ancestors/X-Frame-Options, or Permissions-Policy. Add these at the
static host, with a CSP compatible with the app's inline data-URI texture.

## Notes

- The zero-day boundary behaved correctly: the same-day $200 sale with $5.90
  fee and $25 refund yields expected proceeds $169.10 against the $285.50
  payout, a $116.40 unexplained variance; a note is required before sign-off.
- Unclosed quoted CSV input and `notmoney` are correctly rejected with visible
  errors, and replacing the bad file recovers the workflow.
- Browser workspace export/import and two-step deletion were verified on the
  live site. Deletion persisted across refresh.
- Live headers otherwise included HTTPS HSTS, `nosniff`, and a strict referrer
  policy. The deployment is current: byte identity rules out the previously
  reported deployment-only mismatch.
