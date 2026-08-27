# Independent verification — FAIL

**Candidate:** `570ca33f0c0e945816bcd92e68d38034fbf17814`  
**Live URL:** <https://payout-bundle-matcher.sociobot.in/>  
**Verified:** 2026-08-27 from a clean checkout at the candidate commit.

## Verdict

**FAIL.** The live deployment is genuinely this candidate and the core local
CSV-reconciliation journey is sound, but two remaining PWA/mobile defects
miss the acceptance contract: the advertised in-app service-worker update
cannot activate the waiting worker, and an initial 390 px render creates
document-level horizontal overflow during its entrance animation.

## Local quality gates

```sh
npm ci
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
node .factory/evidence/e2e.mjs
```

- `npm ci` succeeded: 58 packages audited, 0 vulnerabilities.
- `npm test` passed: 3 files, 13 tests. There is no separate lint command;
  the configured `tsc --noEmit` runs as part of `npm run build`.
- Production build passed and emitted `dist/`: initial application JavaScript
  is 30,576 B (10,506 B gzip), CSS 17,743 B (5,110 B gzip), and the WebP
  illustration 52,226 B. All are within the static/PWA budgets.
- The supplied production-preview Playwright journey passed: normal match
  gives `$0.00` with two selected rows; impossible date (`2026-02-30`) and
  malformed money (`12.34.56`) remain on mapping with explicit recovery
  errors; signed state survives refresh; offline reload works; no console or
  page errors; desktop and settled 390 px state have no document overflow;
  keyboard Tab/Enter reaches and activates the skip link; axe reports no
  violations on empty or matched states.
- Fresh mobile Lighthouse on the production preview: Performance 99,
  Accessibility 100, Best Practices 100, SEO 100; LCP 1,223 ms, CLS 0,
  TBT 118 ms.

## Independent live checks

- Every one of the 14 deployable local `dist/` files was fetched and compared
  byte-for-byte with the live equivalent. They match. `staticwebapp.config.json`
  is deployment configuration and is not a public artifact. Thus the prior
  deployment-only concern is not present.
- Live initial navigation requested only
  `https://payout-bundle-matcher.sociobot.in`; browser error/page-error capture
  was empty. Source and network review find no analytics, tracking, CSV
  upload, bank connection, external font, or third-party script. The only
  external call in product code is the user-initiated Sociobot license
  verifier; it is allow-listed by CSP.
- The representative live flow imported a payout and three sales (including
  a void), confirmed mapping, selected two transactions, computed `$0.00`,
  signed off, exported/imported the workspace, and performed the two-step
  deletion. Deletion survived refresh; import restored the signed workspace.
  An unclosed quoted CSV showed a visible error and could be replaced.
  With a same-day window, one transaction is selected, variance is `$116.40`,
  and the exception note is required. CSV output prefixes a source ID of
  `=1+1` as `'=1+1`, preventing spreadsheet formula evaluation.
- At both empty and matched live states axe had zero violations, including
  zero serious/critical findings. No console/page errors were captured.
  Reduced-motion style resolves the hero animation to `1e-05s`; the 390 px
  settled match screen and the 1280 px screen have no page-level overflow.
- The current worker controls the live page and uses
  `settlement-match-v2-shell` / `settlement-match-v2-runtime`; saved signed
  state and the app shell survived an explicit offline 390 px reload.
- Response policy is present live: CSP with `frame-ancestors 'none'`,
  `X-Frame-Options: DENY`, `Permissions-Policy`, nosniff, strict referrer
  policy and HSTS. Hashed JS/CSS use one-year immutable cache control;
  manifest is `application/manifest+json` / `no-cache`; worker is
  `no-cache, no-store, must-revalidate`.

## Defects

### Medium — PWA-01: “Update now” messages the active worker, not the waiting update

The update toast is meant to activate a waiting worker, but
`src/app.ts` sends `SKIP_WAITING` to
`navigator.serviceWorker.controller`. That is the **currently active old
worker**. The newly downloaded worker is available as `registration.waiting`,
and only it needs to receive `self.skipWaiting()`. Calling `skipWaiting()` in
the active worker does not promote the waiting worker, so a user who presses
the advertised Update now control remains on the old release until a later
browser-controlled activation/reload.

The live worker currently has no waiting replacement (as expected for a
single immutable deployment), so a real changed-worker activation cannot be
created against this URL without deploying a different candidate. The failure
is nevertheless deterministic from the shipped update path: an isolated
Chromium reproduction with the same active-worker `message → skipWaiting()`
handler left the newly installed worker waiting and emitted no
`controllerchange` after one second. Send the message to
`registration.waiting` (and reload only after `controllerchange`) before
claiming the PWA update requirement is met.

### Medium — MOB-02: hero entrance animation temporarily widens a 390 px page

On a fresh 390 × 844 live render, while `.hero-art` runs its 650 ms entrance
animation, `document.documentElement.scrollWidth` and `document.body.scrollWidth`
are **399 px** against an `innerWidth` of **390 px**. The hero figure/image
are shifted to x=39…399 by the 24 px `translateX` animation. This permits
9 px of document-level horizontal scrolling until the animation ends. It
reoccurs on fresh/offline reload; after the animation settles, only the
intentionally scrollable transaction table is wider than the viewport.

Keep the animated art within an overflow-clipped container or avoid a
rightward translation on narrow screens. This is distinct from the prior
decorative-disc fix and is not caught by the existing e2e script because it
waits 800 ms before measuring.

## Handoff recommendation

Do not release this candidate as PASS. The financial, privacy, accessibility,
cache/header, offline-reload, and deployment-identity checks pass, but repair
PWA-01 and MOB-02, add regression coverage for a waiting-worker update and
the first 650 ms of a 390 px render, then rerun this verification.
