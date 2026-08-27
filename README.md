# Settlement Match

Settlement Match explains why one processor payout differs from that day’s orders or invoices. It is for a one-store owner or bookkeeper who has a payout CSV and a sales CSV, but does not want to connect a bank account to another subscription service.

The browser-only workflow imports both files, asks the user to confirm every column mapping, suggests transactions from a configurable settlement window, and exposes the arithmetic for gross sales, fees, refunds, timing shifts, and remaining variance. The reviewer can sign off and export an exception CSV or print/PDF report.

Live: <https://payout-bundle-matcher.sociobot.in>

## Privacy and scope

CSV content is parsed and persisted in IndexedDB on the device. There is no analytics, bank connection, server upload, or automatic accounting entry. Users can export/import the entire workspace and delete it from the footer. License verification is the only optional product API call.

This is an evidence-preparation utility, not accounting or tax advice. It does not post to a ledger, reconcile multiple stores, or certify the result.

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Then open the URL Vite prints. The production service worker is intentionally disabled in development.

## Test and build

```sh
npm test
npm run build
npm run preview
```

The exact deployment build command is `npm run build`. Static output lands in `dist/`, with `dist/index.html` at its root. Deploy that directory as a static site with clean-directory support for `/privacy/` and `/terms/`.

## CSV expectations

- Payout CSV: payout ID, payout date, and deposit/net amount; optional aggregate fee, refund, and gross columns.
- Sales/invoice CSV: order or invoice ID, paid date, and gross; optional per-row fee, refund, and status columns.
- Dates should use an ISO timestamp/date or a browser-readable export date. Money may include currency marks, commas, or accounting parentheses.
- Files are limited to 10 MB each to keep local browser processing responsive.

Sample CSVs are available inside the empty workspace.

## Paid unlock

The full matcher, sign-off, accessibility, workspace export/import, and report exports are free. A $19 one-time Pro license saves reusable column maps on the device and removes the product credit from print reports. Checkout and verification use only the Sociobot billing API; no product ID or payment-provider SDK is embedded.

## Project notes

The product-specific visual system and generated-image provenance are in [`.factory/design.md`](.factory/design.md). Verification and known gaps are recorded in [`.factory/handoff.md`](.factory/handoff.md).

MIT licensed. See [`LICENSE`](LICENSE).
