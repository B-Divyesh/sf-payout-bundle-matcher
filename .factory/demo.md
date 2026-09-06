# Settlement Match demo sandbox

## Entry point

- Live: <https://payout-bundle-matcher.sociobot.in/demo>
- Local production preview: <http://127.0.0.1:4173/demo>
- Query alias: `/?demo=1`

The first-screen **Try it with sample data** link opens this route in one click.

## Sample

The demo opens payout `PO-1042` with four sales. Two selected sales total $320.00. Fees are $9.50, one refund is $25.00, and one sale is a timing shift. Expected proceeds and the actual payout are both $285.50, leaving $0.00 variance.

One older sale falls outside the three-day window. One void sale is excluded.

## Isolation and reset

Demo state exists only in page memory. It never opens the real `settlement-match` IndexedDB database and never reads or writes license or column-mapping localStorage keys.

**Reset demo** replaces every demo change with a fresh copy of the sample. **Start for real** leaves the demo and reloads the separate real IndexedDB workspace. Leaving demo mode discards demo changes.

The service worker caches the demo shell and sample, so `/demo` works offline after the first visit.
