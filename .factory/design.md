# Settlement Match — visual thesis

## Direction: surreal editorial scenery

Settlement reconciliation feels like looking at an ordinary landscape whose
geometry is subtly wrong: a single deposit on one side, many receipts on the
other, and a navigable path between them. The interface turns that anxiety into
a calm paper landscape. A monumental coral coin, small receipt monoliths, and a
dark balancing arch make the bundle relationship visible before any CSV is
loaded. Decoration is kept to the landing masthead and small reconciliation
motifs; working tables stay quiet and exact.

This is an intentionally light, single-mode utility. Warm paper supports long
review sessions and printed/PDF reports, while the dark ink and cobalt actions
meet contrast requirements. It does not follow system dark mode because the
editorial paper metaphor and print-equivalent report are part of the product's
identity.

## Tokens

- `paper` #F3EBDD — canvas, like an accountant's working sheet
- `paper-high` #FFF9EF — working surfaces
- `ink` #17242B — primary text, table rules, and the balancing arch
- `ink-soft` #536067 — secondary text (7.1:1 on paper)
- `cobalt` #1746A2 — primary action and focus (7.1:1 on paper)
- `cobalt-deep` #102D68 — active action
- `coral` #D8563A — editorial accent, never small body text
- `mustard` #C69726 — timing-shift accent and artwork only
- `sage` #2F6A55 — explained/success text and outlines
- `clay` #A53A30 — error text and outlines
- `rule` #C8BDAA — structural dividers

## Typography

- Display: Georgia, Cambria, "Times New Roman", serif. Its editorial tension
  gives the product a point of view without downloading a font.
- Utility: Inter fallback stack (`ui-sans-serif, system-ui, sans-serif`) for
  labels, forms, and dense tables. No font files or third-party requests.
- Scale: 14 / 16 / 20 / 28 / clamp(42–72) px. Numbers use tabular figures.
  Body copy is 16–18 px at 1.55 line-height, with a 68-character measure.

## Spacing and shape

- 4 px base rhythm; primary intervals 8, 12, 16, 24, 32, 48, 72 px.
- Content max width 1180 px. The working view favors a 5:7 control/results
  split on desktop and a single linear flow at 760 px and below.
- Corners are mostly 2–8 px, like cut paper—not generic pill cards. True pills
  are reserved for statuses. Fine 1 px rules group related content before
  boxes do.
- Controls are at least 44 px high. Focus is a 3 px cobalt ring with a paper
  offset.

## Interaction grammar

- The core flow is a visible four-stop route: Upload → Map → Match → Sign off.
  Only the current stop is saturated; completed stops carry a check and text.
- Rows are selected like ledger lines, not dragged. Suggested matches are
  deterministic and reversible; every important total exposes its arithmetic.
- Success is the physical idea of balance: two sides align around a thin rule.
  Exceptions retain plain-language reasons, never color alone.
- Destructive data deletion requires explicit confirmation and names the
  consequence. Undo is used for individual exclusions.

## Motion policy

- 180 ms for hover/press/focus and 260 ms for panels entering from the next
  route stop. Only opacity and transform animate.
- The hero coin drifts into alignment once on first paint (600 ms), suggesting
  settlement; nothing loops.
- With `prefers-reduced-motion: reduce`, transforms and smooth scrolling are
  removed and states change instantly.

## Original asset plan and provenance

### `public/settlement-landscape.webp`

Use: wide landing masthead, showing a bundle of many receipts becoming one
settlement. The artwork does not depict the product UI or imply automation.

Prompt sheet:

- Subject: one oversized coral coin balanced opposite a small fan of blank
  receipt slips, connected by a narrow cobalt path over an ink-black arch
- World: quiet impossible bookkeeping landscape on tactile warm paper
- Materials: cut paper, matte stone, lightly speckled gouache, subtle halftone
- Light/lens: long morning shadows, slightly elevated orthographic editorial
  view, generous negative space, crisp silhouettes
- Palette words: warm ledger paper, inky charcoal, accountant cobalt, coral
  stamp, muted mustard
- Negative list: people, hands, currency symbols, readable text, numbers,
  logos, brands, dashboards, glossy 3D, gradients, watermark, visual clutter

Generation prompt:

> Use case: stylized-concept. Asset type: responsive website hero
> illustration. A surreal editorial bookkeeping landscape on tactile warm
> ledger paper: one oversized coral coin balanced opposite a small fan of
> blank receipt slips, connected by a narrow cobalt path crossing a monumental
> ink-black arch. Cut-paper and matte-stone forms with lightly speckled gouache
> and restrained halftone texture. Long morning shadows, slightly elevated
> orthographic composition, strong readable silhouettes, generous quiet
> negative space, warm paper / charcoal / cobalt / coral / muted mustard
> palette. No people, hands, currency symbols, readable text, numbers, logos,
> brands, dashboards, glossy 3D, gradients, watermark, or clutter.

Generated with the factory Azure image deployment (`factory-image`) on
2026-08-27. Original AI-generated artwork, reviewed for malformed text,
unintended symbols/brands, composition, and palette. Distributed with this
project under the MIT license; the footer discloses generated imagery.

App icons and small balance marks are original hand-authored SVG/CSS geometry,
also MIT-licensed with the source.
