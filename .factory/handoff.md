# Settlement Match repair 3 handoff

## Independent verification 4

**PASS — 0 findings and 0 untested claims.** On 2026-09-06, an independent
clean-install verification reviewed implementation
`0ab5a2b54a4c67283e61a549a22e088968555f16` and documentation
`74f62ad1f93529247c08025026a996db9eafcbd1`. `npm test` passed (15 unit + 24
browser tests), all 18 declared claim commands passed individually, and the
full live suite passed 24/24. Fresh desktop/phone inspection, demo/reset/real
workspace isolation, privacy, normal/invalid/boundary/recovery paths, offline
and update behavior, routes/legal/404, accessibility, and prior finding
regressions passed. Live mobile Lighthouse was 100 in all four categories.

The detailed report is `.factory/verification-4.md`, copied to
`/work/.evidence/qa-report.md`; machine result is
`/work/.evidence/qa-result.json`. No product code changed during verification.
The external billing-registration dependency remains accurately disclosed and
does not expose a broken checkout.

## Current result

The repair is deployed and all applicable local and live checks pass. The
deployed implementation is
`0ab5a2b54a4c67283e61a549a22e088968555f16`. This handoff is a later,
report-only change and does not require another product image.

The one external dependency is billing registration. The Sociobot checkout
endpoint still returns `404 enabled factory product`, so the site does not show
a purchase link or claim that Pro can be bought. It keeps the researched $19
one-time offer, paid deliverables, restore field, and license verification.
Public offer metadata is in `.factory/billing-offer.json` and
`/work/.evidence/billing-offer.json` for the billing-registration operator.
The free matcher is unaffected.

## What changed

- Added `/demo` and `?demo=1` as one-click, isolated sample entry points.
  Four realistic sales produce a populated result: two selected sales, $320
  gross, $9.50 fees, $25 refunds, and $0 variance against payout PO-1042.
- Added the persistent `Demo — sample data, nothing is saved` banner with
  `Reset demo` and `Start for real`. Demo mode never reads or writes the real
  IndexedDB workspace or real license storage.
- Rewrote the first screen to say the job, audience, and first action before
  scrolling. Removed mood headings and recorded the word-count and terminology
  audit in `.factory/copy-audit.md`.
- Added `.factory/claims.json` with 18 distinct public claims and 18 distinct,
  outcome-based Playwright commands. The original 22 review statements are
  covered without duplicating claims that describe the same observable privacy
  outcome.
- Kept the exact $19 one-time Pro offer and paid features, but replaced the
  broken checkout action with an honest registration-pending state. Existing
  licenses can still be pasted, verified, cached, and used.
- Added route titles, canonical and social metadata, an apple-touch icon, a
  1200 x 630 social image derived from the existing original artwork, shared
  route headers and footers, a sitemap demo entry, and a designed real 404.
- Made the service worker route-aware and precached Demo, Privacy, Terms, 404,
  and offline pages. Legal routes no longer fall back to the matcher.
- Raised footer, row-selection, and other small controls to the 44 px touch
  target baseline while retaining visible focus, reduced-motion behavior, and
  phone table containment.
- Made `npm test`, `npm run test:claims`, and `npm run test:browser`
  self-contained from a clean checkout. Browser tests pin Playwright 1.58.2.
- Updated the README, demo record, design provenance, catalog description,
  license, privacy and terms pages, deployment config, PWA manifest, and cache
  version.

## Review 1 finding disposition

| Finding | Current proof | Disposition |
| --- | --- | --- |
| DEMO-01 isolated demo missing | `/demo` seeds the realistic result; the persistent banner, reset, real-workspace isolation, and exit behavior pass in a fresh context | Fixed |
| BILL-01 checkout broken | No failed checkout is exposed; exact paid terms remain, existing licenses verify, and operator metadata names registration as pending | Fixed in product; external registration remains |
| CLAIM-01 22 statements untested | 18 manifest entries each have one unique demo-based outcome test; every declared command passed individually | Fixed |
| COPY-01 first screen and headings | Job, audience, sample action, outcome note, and three facts fit a 390 px first screen; copy audit has no flagged sentence | Fixed |
| ROUTE-01 demo/404 behavior | `/demo` has its own title; unknown paths return a designed HTTP 404 with a home link; sitemap lists Demo | Fixed |
| SITE-01 metadata/shared structure | All public pages have route titles, descriptions, canonicals where applicable, shared navigation/footer, skip links, social metadata, and build identity | Fixed |
| PWA-02 wrong offline legal page | Route-aware offline tests load the cached Privacy and Terms pages, and unknown paths use the offline page | Fixed |
| A11Y-02 footer target size | Browser measurements at 390 px show footer and workspace controls at least 44 px high | Fixed |

## Earlier verification finding disposition

| Earlier finding | Current proof | Disposition |
| --- | --- | --- |
| FIN-01 impossible date normalization | `2026-02-30` stays on mapping with a real-calendar error and recovers after correction | Fixed |
| FIN-02 malformed money truncation | `12.34.56` stays on mapping with a money error and recovers after correction | Fixed |
| A11Y-01 excluded-row contrast | Axe reports no serious or critical issue on matched output | Fixed |
| SEC-01 spreadsheet formula injection | Exported formula-like source text is neutralized in the downloaded CSV | Fixed |
| MOB-01 settled 390 px overflow | The document does not overflow; the results table scrolls within its own region | Fixed |
| DEP-01 cache and manifest MIME | Hashed assets are immutable and the manifest has the correct MIME type | Fixed |
| DEP-02 response headers | CSP, frame denial, permissions policy, nosniff, referrer policy, and HSTS are live | Fixed |
| PWA-01 waiting-worker activation | The changed-worker browser test activates the waiting worker and new cache | Fixed |
| MOB-02 entrance overflow | Fresh first-paint and settled phone checks show no document overflow | Fixed |

## Verification

The documented clean setup was used with Node.js 20 or newer:

```sh
npm ci
npm test
npm run test:browser
```

Results:

- `npm ci`: 59 packages installed, 60 audited, 0 vulnerabilities.
- Unit tests: 15/15 passed.
- Full Playwright suite: 24/24 passed locally and 24/24 passed against the
  deployed HTTPS origin. This includes 18 claim tests and 6 site, route,
  keyboard, accessibility, privacy, link, and reduced-motion checks.
- Every exact `test` command in `.factory/claims.json` passed individually.
  Output is `/work/.evidence/claim-commands-final.log`.
- Build/type check passed and produced `dist/index.html`. Initial JS is
  35.03 kB / 11.71 kB gzip and CSS is 21.18 kB / 5.82 kB gzip.
- Fresh desktop and 390 px phone contexts showed the job, audience, and sample
  action before scrolling. Demo showed four rows and $0 variance; reset
  restored the sample; leaving Demo restored the untouched real workspace.
- Normal, invalid, boundary, and recovery paths passed: mapping confirmation,
  configurable lookback, sign-off persistence, malformed dates and money,
  leap day, same-day window, 10 MiB limit, safe CSV export, workspace
  import/export, print, deletion, and restart persistence.
- Axe found zero serious or critical issues on Home, Demo, Privacy, Terms, 404,
  and populated results. Keyboard, dialog focus return, visible focus, touch
  targets, 200% text behavior, and reduced motion passed.
- Offline Demo, saved state, Privacy, Terms, unknown fallback, and service
  worker update activation passed. Recorded demo traffic stays same-origin;
  explicit license restoration contacts only `api.sociobot.in`.
- `/opt/fleet/lib/verify-url.sh` passed on HTTPS with one h1, `lang=en`, main,
  alt text, labels, and no console errors. Evidence is under
  `/work/.evidence/live-repair-3-final/`.
- Mobile Lighthouse on the live origin: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; LCP 1.25 s, FCP 0.95 s, TBT 32 ms, CLS 0,
  71,914 bytes transferred.
- All 18 public build artifacts compared with the final candidate were
  byte-identical. `/`, `/demo`, `/privacy/`, and `/terms/` return 200; an
  unknown route intentionally returns the designed 404.

## Deployment

- Product: `payout-bundle-matcher`
- Live origin: <https://payout-bundle-matcher.sociobot.in>
- Implementation/deployment SHA:
  `0ab5a2b54a4c67283e61a549a22e088968555f16`
- Successful deployment ID: `510ee2b1-355a-42c0-ae3d-bc49d9fcf244`
- Deployment class: static PWA; no backend, shared database, tenant, CLI,
  library, or desktop persistence checks apply.

The initially referenced `/work/.evidence/qa-report.md` was absent when this
repair started. `.factory/review-1.md` and all three earlier verification
reports were present and reviewed. The final QA report has been recreated at
that evidence path. `.factory/brief.json` was absent, so the researched brief
embedded in the work order was used as the scope source.

## Remaining dependency

The controller's billing-registration operator must register or enable
`payout-bundle-matcher` in the Sociobot billing engine. After registration,
restore the hosted checkout action and verify a real purchase, return license,
entitlement, refund revocation, and cross-device restore. No provider key or
test entitlement was invented. Everything else in the authorised product
scope is implemented and verified.
