# Settlement Match

Settlement Match explains one processor payout from sales, fees, refunds, and timing shifts. It is for a one-store owner or bookkeeper with a payout CSV and a sales or invoice CSV.

The app runs in the browser at <https://payout-bundle-matcher.sociobot.in>. Try the isolated sample at <https://payout-bundle-matcher.sociobot.in/demo>.

## What it does

The user confirms the CSV column mapping before any mapped amount enters the calculation. A configurable lookback suggests sales, while every selection and calculation remains visible. The reviewer can sign off, export an exception CSV, print or save a PDF, and export or import the workspace.

Real workspace data persists in IndexedDB on the current device. The confirmed delete action removes imported and saved reconciliation data. Each CSV is limited to 10 MiB.

The free matcher, sign-off, accessibility, and exports remain available without Pro. A verified $19 one-time Pro license saves reusable column mappings and removes the print credit. Checkout registration is pending, so Pro is not available to buy yet. Existing license holders can still restore access.

## Privacy and limits

CSV matching uses no upload server, bank connection, analytics, advertising tracker, or automatic ledger posting. Optional license verification contacts only the Sociobot billing API. The app is not accounting or tax advice and does not certify a reconciliation.

The sample matcher works offline after the first visit. Use the browser’s site controls if you also want to remove the Pro license token.

See the live [privacy policy](https://payout-bundle-matcher.sociobot.in/privacy/) and [terms](https://payout-bundle-matcher.sociobot.in/terms/).

## Run from a clean checkout

Use Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. The production service worker is disabled in development.

## Test every claim and build

```sh
npm test
npm run build
npm run preview:factory
npm run test:browser
```

`npm test` runs unit tests, builds the static product, and runs every browser claim and site check. Individual commands are declared in [`.factory/claims.json`](.factory/claims.json).

The production build lands in `dist/`, with `dist/index.html` at its root. Deploy the directory to the product’s static host using `public/staticwebapp.config.json`.

## Project records

- [Demo sandbox](.factory/demo.md)
- [Design system and artwork provenance](.factory/design.md)
- [Verification handoff](.factory/handoff.md)

MIT licensed. See [LICENSE](LICENSE).
