# Settlement Match payout reconciliation review 1

**Verdict: FAIL**

- Review date: 2026-09-05–06
- Live URL: <https://payout-bundle-matcher.sociobot.in>
- Implementation reviewed: `6505c57be99c36f381ca10979ace730391599c37`
- Documentation checkout reviewed: `2d713f61df5815cb0bff3d624c378307d0deba44`
- Findings: **8** — 3 high, 4 medium, 1 low
- Untested public claims: **22**

The core local payout matcher works, but this review cannot pass. The required
sample sandbox and claim manifest do not exist, and the advertised paid
checkout is broken. Five further site, copy, offline-routing, and touch-target
findings remain. PASS requires zero findings and zero untested claims.

## What a new visitor sees

- Job stated before scrolling: match a processor payout to sales, fees,
  refunds, and timing shifts.
- Audience stated before scrolling: **missing**. The README names a one-store
  owner or bookkeeper, but the live first screen does not.
- First action: **Match a payout**, which scrolls to two file inputs.
- Sample action: **missing** on the first screen. A later **Download sample
  CSVs** button downloads two files but does not load or show a result.

Fresh 1366 × 900 and 390 × 844 browser contexts both showed the same first
screen. The headline, description, and action were visible without scrolling,
and neither viewport overflowed.

## Findings

### High — DEMO-01: the required one-click sample sandbox does not exist

There is no **Try it with sample data** action, no `.factory/demo.md`, no
persistent **Demo — sample data, nothing is saved** label, no **Reset demo**,
and no **Start for real** action. Both `/demo` and `/?demo=1` return the normal,
empty app with the home title and zero sample rows. **Download sample CSVs**
only downloads `sample-payout.csv` and `sample-sales.csv`; it leaves the app
empty and makes the visitor upload and map the files manually.

This is also a data-isolation failure. In a fresh browser context, I imported
a workspace containing payout `REAL-77` and sale `REAL-A`, then opened
`/demo`. That URL displayed the same real workspace and `$0.00` result because
it uses the normal IndexedDB namespace. It did not show a demo label or reset
control. The test used disposable browser data and did not alter user data.

Evidence: `.factory/evidence/review-1-live.mjs` and
`/work/.evidence/live-review/demo-reads-real-workspace.png`.

### High — BILL-01: the advertised $19 checkout is broken

The **Get Pro** dialog advertises a $19 one-time purchase and links to:

`https://api.sociobot.in/api/v1/products/payout-bundle-matcher/checkout`

A direct GET on 2026-09-05 returned HTTP 404 with
`{"error":"enabled factory product","status":404}`. This is a broken paid
user path, not the expected deliberate 404 test for an unknown site route.
The separate license verification endpoint returned a normal `valid:false`
response for a fake token, so failure recovery there works.

### High — CLAIM-01: all 22 material public claims lack required claim tests

`.factory/claims.json` is missing. Therefore no public claim has one declared
`@claim:<id>` command that starts from the demo sandbox and proves the
observable result. Some behavior passed ordinary unit or browser checks, but
that does not satisfy the claims contract.

The 22 unique material claims are:

1. Reconciles one payout from sales, fees, refunds, timing shifts, and variance.
2. Suggests transactions from a configurable settlement window.
3. Uses no mapped amount until the user approves the mapping.
4. Lets a reviewer sign off and retains the signed report.
5. Exports an exception CSV.
6. Prints or saves a PDF report.
7. Exports and imports the whole workspace.
8. Deletes imported and saved reconciliation data.
9. Enforces a 10 MB limit for each CSV.
10. Provides sample CSVs in the empty workspace.
11. Processes CSV data in the browser without sending customer data away.
12. Persists workspace data in IndexedDB.
13. Stores the license and reusable map only in local browser storage.
14. Uses no analytics or advertising trackers.
15. Uses no bank connection or bank login.
16. Uses no CSV upload server.
17. Makes no automatic accounting entry or ledger posting.
18. Keeps matching, saving, and exporting available offline.
19. Keeps matching, sign-off, accessibility, and exports free.
20. Sells Pro as a $19 one-time license.
21. Pro saves reusable maps and removes the print credit.
22. Uses only the Sociobot billing API for optional license traffic.

Untested claim count: **22**.

### Medium — COPY-01: the first screen and section headings break the plain-words contract

The first screen does not name the audience, does not offer the required
sample action, and shows only one short fact (**Local-only processing**) rather
than three privacy, offline, and price facts. **One payout. Every moving part**
and **Evidence, not accounting theatre** are mood or metaphor copy rather than
section names. `.factory/copy-audit.md` is also missing, so the required word
count and terminology check was not completed.

### Medium — ROUTE-01: demo and unknown routes do not have correct route behavior

- `/demo` uses the home title instead of `Demo — Settlement Match`.
- `/missing-review-route` returns HTTP 200 and the home app. There is no
  designed 404 response or way back because the unknown route is not
  identified as missing.
- `sitemap.xml` omits `/demo`.

A deliberate HTTP 404 would be expected here. The defect is that the server
silently serves a 200 home page for an unknown address.

### Medium — SITE-01: required metadata and shared page structure are incomplete

The home page has no canonical link, Open Graph metadata, Twitter card, or
apple-touch icon. Privacy and Terms have correct route titles but no meta
description or canonical link. Their headers have no navigation or skip link,
and their footer is not the shared footer. The main footer also omits **Built
by Param Factory** and a build/version value. The header has no Demo or Privacy
navigation link, and the paid offer is only a dialog rather than the required
landing-page tier section.

### Medium — PWA-02: an uncached offline legal link displays the wrong page

After one successful home visit and service-worker control, opening `/privacy/`
offline returned HTTP 200 under the privacy URL but rendered the matcher home
page with title `Settlement Match — explain a processor payout`. It rendered
neither Privacy nor the supplied offline fallback. Core home reload, saved
state, matching, and exports remain available offline.

### Low — A11Y-02: footer controls miss the 44 px touch-target minimum

In a fresh 390 px phone viewport, the visible Privacy and Terms links measured
47 × 20 px and 39 × 20 px. **Delete local data** measured 131 × 40 px. The
controls are keyboard reachable and axe found no automated violation, but the
required touch height is 44 px.

## Core workflow and recovery evidence

The useful free workflow remains sound:

- Normal: two realistic sales explain the `$285.50` payout at `$0.00`; two
  rows are selected, sign-off persists, workspace export/import works, and
  delete survives reload.
- Invalid: impossible `2026-02-30`, malformed `12.34.56`, a header-only CSV,
  and a missing exception note all produce recoverable errors.
- Boundary: leap day `2024-02-29` is accepted. A same-day window selects one
  sale and gives the correct `$116.40` variance. A file over 10 MiB gives the
  stated size error; replacing it with a valid file recovers.
- Export safety: a source value beginning `=INJECT` is neutralized in the CSV.
- Privacy: normal and sample-file journeys made no cross-origin request. An
  explicit fake-license restore called only `api.sociobot.in` and failed
  quietly. No credential was used or recorded.
- Accessibility: axe found zero violations on welcome, matched, and Privacy
  states. Skip-link focus has a 3 px outline; the native Pro dialog takes
  focus and returns it to **Get Pro** on Escape. Reduced motion resolves to an
  effectively instant animation.
- PWA: a 390 px saved workspace reloads offline. The isolated changed-worker
  test activates the waiting worker and finds the new cache.
- Missed AI leverage: none. Deterministic local arithmetic and explicit human
  mapping are the correct fit for this financial evidence task.
- Backend, tenant isolation, restart persistence, and 429 checks: not
  applicable; this is a static local-first PWA. CLI/library/desktop checks are
  also not applicable.

## Earlier finding disposition

| Earlier finding | Current proof | Disposition |
| --- | --- | --- |
| FIN-01 impossible dates normalized | Live browser keeps `2026-02-30` on mapping with a real-calendar error | Fixed |
| FIN-02 malformed money truncated | Live browser keeps `12.34.56` on mapping with a money error | Fixed |
| A11Y-01 excluded-row contrast | Axe reports zero violations on matched state | Fixed |
| SEC-01 spreadsheet formula injection | Exported `=INJECT` is prefixed as safe text | Fixed |
| MOB-01 settled 390 px overflow | No document overflow; only the table scrolls locally | Fixed |
| DEP-01 cache and manifest MIME | Hashed JS is one-year immutable; manifest MIME is correct | Fixed |
| DEP-02 response headers | CSP, frame denial, permissions policy, nosniff, referrer policy, and HSTS are live | Fixed |
| PWA-01 waiting-worker activation | Browser update simulation activates the changed worker | Fixed |
| MOB-02 entrance overflow | Four first-paint samples and settled phone view have no document overflow | Fixed |

## Commands and measurements

Run from the clean checkout at documentation SHA `2d713f61…`:

```sh
npm ci
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
npm run test:browser
BASE_URL=https://payout-bundle-matcher.sociobot.in npm run test:browser
node .factory/evidence/independent-verification-3.mjs
BASE_URL=https://payout-bundle-matcher.sociobot.in node .factory/evidence/independent-verification-3.mjs
VERIFY_NODE_MODULES=/work/repo/node_modules /opt/fleet/lib/verify-url.sh \
  https://payout-bundle-matcher.sociobot.in /work/.evidence/live-review
node .factory/evidence/review-1-live.mjs
```

Results:

- Clean install: pass, 59 packages audited, 0 vulnerabilities.
- Unit tests: pass, 4 files and 15 tests.
- Build/type check: pass; `dist/index.html` exists.
- Initial assets: JS 30,769 B / 10,590 B gzip; CSS 17,862 B / 5,130 B
  gzip; hero 52,226 B.
- Supplied browser journeys: pass locally and live.
- Independent normal/error browser journeys: pass locally and live.
- `verify-url.sh`: pass; title, `lang`, one h1, main, alt, labels, and console
  checks passed.
- Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100,
  SEO 100; LCP 1.20 s, CLS 0, TBT 149 ms, 96,576 B transfer.
- Candidate/live identity: all 15 public build artifacts returned 200 and had
  matching SHA-256 digests. `staticwebapp.config.json` is host configuration
  and is not public.
- Claim commands: none could be run because `.factory/claims.json` is absent.

Evidence files outside the repository are under
`/work/.evidence/live-review/`. The required report copy is
`/work/.evidence/qa-report.md` and the machine result is
`/work/.evidence/qa-result.json`.

## Required next steps

1. Add the isolated one-click demo, its persistent controls, `/demo` title,
   separate storage namespace, documentation, and end-to-end tests.
2. Register or enable the paid product so the public checkout link works, or
   remove the paid offer until it does.
3. Add `.factory/claims.json` and one demo-based observable test per listed
   claim; remove any claim that cannot be proved.
4. Repair first-screen copy, route/404 handling, metadata, shared structure,
   offline legal routing, and footer touch targets.
5. Repeat the complete review. Do not declare PASS until findings and untested
   claims are both zero.
