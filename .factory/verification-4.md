# Independent verification 4 — PASS

**Verdict: PASS**

- Findings: **0** (critical 0, high 0, medium 0, low 0)
- Untested public claims: **0**
- Implementation candidate: `0ab5a2b54a4c67283e61a549a22e088968555f16`
- Documentation checkout reviewed: `74f62ad1f93529247c08025026a996db9eafcbd1`
- Live URL: <https://payout-bundle-matcher.sociobot.in>
- Verified: 2026-09-06 from a clean `npm ci` installation.

Settlement Match is a local CSV tool for a one-store owner or bookkeeper who
needs to explain one processor payout. A fresh desktop and 390 px phone visit
both state the job, audience, and first action before scrolling: **Match a
payout to your sales**, for one-store owners and bookkeepers, then **Try it
with sample data**. The first action opens a completed, realistic sample
match.

## Result

**PASS.** The shipped live runtime is the implementation candidate. The core
free flow, demo isolation, offline behavior, privacy boundaries, accessibility,
routes, legal pages, PWA update path, and declared paid-offer status all passed.
Checkout registration remains an external Sociobot dependency, but the product
accurately says checkout is unavailable and exposes no broken purchase action;
this is not a finding.

## Quality gates

Commands run from the documented clean setup:

```sh
npm ci
npm test
npm run test:browser
BASE_URL=https://payout-bundle-matcher.sociobot.in npm test
BASE_URL=https://payout-bundle-matcher.sociobot.in npm run test:browser
BASE_URL=https://payout-bundle-matcher.sociobot.in \
  node .factory/evidence/independent-verification-3.mjs
VERIFY_NODE_MODULES=/work/repo/node_modules /opt/fleet/lib/verify-url.sh \
  https://payout-bundle-matcher.sociobot.in /work/.evidence/qa4/verify-url
```

- `npm ci` installed 59 packages and reported 0 vulnerabilities.
- `npm test` passed: 15 unit tests and 24 browser tests. `npm run build` passed
  and emitted `dist/index.html`.
- Every one of the 18 exact commands declared in `.factory/claims.json` was
  also run individually; each selected exactly one `@claim:` test and passed.
- The complete live suite passed 24/24. It includes all claims, first-screen
  phone checks, route titles/metadata/404, axe serious/critical checks, link
  checks, keyboard/focus/dialog/touch/reduced-motion checks, and offline legal
  navigation.
- Independent live regression evidence confirmed a recoverable header-only CSV
  error, a $20 variance requiring a note, spreadsheet-safe exported text,
  deletion surviving reload, no outgoing request in the normal flow, zero axe
  serious/critical issues, and no console/page errors.
- `verify-url.sh` passed: HTTP 200, title, `lang=en`, one h1, main landmark,
  no images missing alt text, no unlabeled buttons, and no console errors.
- Mobile Lighthouse against the live origin: Performance 100, Accessibility
  100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.2 s, TBT 0 ms, CLS 0,
  total transfer 70 KiB. Raw report:
  `/work/.evidence/qa4/lighthouse-mobile.json`.

The local production entry is 35.03 kB JavaScript (11.71 kB gzip) and 21.18
kB CSS (5.82 kB gzip), within the static-product budgets.

## Declared claim evidence

All commands use `npm run test:claims -- --grep @claim:<id>` and passed in a
fresh browser context. No declared claim is untested.

| Claim IDs verified individually | Result |
| --- | --- |
| `demo-isolation`, `payout-reconciliation`, `settlement-window`, `mapping-confirmation`, `signoff-persistence`, `exception-csv` | Pass |
| `print-report`, `workspace-portability`, `delete-data`, `csv-size-limit`, `local-processing`, `workspace-persistence` | Pass |
| `license-local-storage`, `offline-workflow`, `free-core`, `pro-status`, `pro-features`, `billing-api-only` | Pass |

The demo was also inspected directly at `/demo`: it displayed the persistent
**Demo — sample data, nothing is saved** banner, reset control, and Start for
real link. Its four sales show the expected sample calculation: $320.00 gross,
$9.50 fees, $25.00 refund, one timing shift, $285.50 payout, and $0.00
variance. Claim coverage proves reset restores the sample and leaving Demo
returns to an unchanged real IndexedDB workspace.

## Normal, invalid, boundary, recovery, and offline paths

- Normal: the sample and independent real-file journeys reconcile selected
  sales, fees, refunds, timing shifts, payout, and variance; signed reports
  persist across reload and export/print paths work.
- Invalid/recovery: header-only CSV, impossible `2026-02-30`, malformed
  `12.34.56`, and a file over 10 MiB produce visible errors and valid
  replacements recover the flow.
- Boundary: same-day selection changes the sample to one selected sale and
  `$116.40` variance; valid leap day input is accepted; an outstanding
  variance requires an exception note before sign-off.
- Privacy: recorded demo traffic during matching, signing, and export stayed
  same-origin. An explicit license restore is the sole external request and
  targets only the Sociobot product verification endpoint. No tracker, bank
  connection, CSV upload, or automatic ledger action was observed.
- Offline/PWA: Demo reloads offline after the first visit and remains usable;
  cached Privacy renders as Privacy offline, an uncached route renders the
  designed offline fallback, and the changed-worker regression activates the
  waiting worker. There is no backend, tenant, health, restart, or 429 path in
  this static local-first PWA.

## Live runtime and site inspection

Fresh 1440 px desktop and 390 px phone browser contexts had no console or
page errors, made only same-origin initial requests, and had no document-level
horizontal overflow. Screenshots are at `/work/.evidence/qa4/desktop.png`,
`/work/.evidence/qa4/phone.png`, and `/work/.evidence/qa4/demo-phone.png`.
The visual system matches the recorded warm-paper editorial design and is
readable on both sizes.

All 18 publicly served build artifacts were byte-identical to the local build
from `0ab5a2b`. `staticwebapp.config.json` is host configuration rather than a
public artifact; its public URL intentionally returns the designed 404 and was
not compared as an asset. `/`, `/demo`, `/privacy/`, and `/terms/` returned
200. An unknown route returned the designed HTTP 404 with its own title and
return link. Live headers provide the CSP (including `frame-ancestors 'none'`),
X-Frame-Options, permissions policy, nosniff, referrer policy, and HSTS.
Hashed assets are immutable, the manifest has `application/manifest+json`,
and the service worker is no-cache.

## Earlier finding disposition

| Earlier finding | Independent current disposition |
| --- | --- |
| FIN-01 impossible date normalization | Fixed: `2026-02-30` remains on the mapping screen with a real-calendar error and recovers. |
| FIN-02 malformed money truncation | Fixed: `12.34.56` remains on the mapping screen with a money error and recovers. |
| A11Y-01 excluded-row contrast | Fixed: populated output has no axe serious or critical issue. |
| SEC-01 spreadsheet formula injection | Fixed: independently verified export neutralizes formula-like source text. |
| MOB-01 settled phone overflow | Fixed: no document overflow; only the intentional table scroller is wide. |
| DEP-01 immutable cache and manifest MIME | Fixed live: hashed assets are immutable and manifest MIME is correct. |
| DEP-02 response security headers | Fixed live: CSP, frame denial, permissions policy, nosniff, referrer policy, and HSTS are present. |
| PWA-01 waiting worker activation | Fixed: changed-worker regression activates the waiting worker. |
| MOB-02 entrance phone overflow | Fixed: four first-paint samples and settled mobile state have no page overflow. |
| DEMO-01 missing/isolation-unsafe demo | Fixed: one-click isolated demo, banner, reset, real-workspace exit, and sample result pass. |
| BILL-01 broken checkout | Fixed in product: checkout is honestly unavailable, with no broken action. Billing registration remains external. |
| CLAIM-01 missing claim tests | Fixed: 18 declared claims have 18 individual outcome tests, all passing. |
| COPY-01 first-screen and heading copy | Fixed: job, audience, sample action, outcome note, and three facts appear before scrolling. |
| ROUTE-01 demo/404 route behavior | Fixed: distinct Demo route/title and designed HTTP 404 pass. |
| SITE-01 metadata/shared structure | Fixed: route metadata, shared skeleton, legal pages, footer, and sitemap pass. |
| PWA-02 offline legal routing | Fixed: cached Privacy renders correctly offline; uncached routes use the offline page. |
| A11Y-02 sub-44 px footer controls | Fixed: live phone measurements in the browser suite meet 44 px. |

## Notes

No product code was modified during this verification. The only remaining
external work is Sociobot registration of the preserved $19 Pro offer. Once
that is done, a future verification should exercise hosted checkout, return
license, entitlement, refund revocation, and cross-device restore. It does not
block this PASS because the site does not present checkout as available.
