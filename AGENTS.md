<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:house-check-project-rules -->

# House Check — project rules

A tool that answers one question: is a given Toronto listing a reasonable purchase for Paul and
Armando? Target areas: the Annex, around U of T, Trinity Bellwoods. Read `PLAN.md` first.

## The one idea the whole app rests on

In this market **the list price is a marketing decision, not a valuation.** Comps listed between
$989k and $1.199M sold 19.7–42.0% over ask; comps listed above $1.5M sold at a median 94.6% of ask.
So the app models a *predicted landing price* and runs every calculation on that, never on the ask.
A $1.2M listing can fail a $1.5M ceiling while a $1.55M listing passes.

## Do not touch without a human

**`lib/assumptions.ts` is effectively read-only.** Every value carries a `verified` date and a
`source` URL: land transfer tax brackets, the stress test, down-payment minimums, the Toronto mill
rate, zoning and heritage rules. These were verified against primary sources on 2026-08-31 and
several are counter-intuitive on purpose:

- Toronto's MLTT brackets **changed on 2026-04-01**. Pre-2026 tables are wrong above $2M.
- The insured-mortgage threshold is **$1.5M**, not $1M. Canada's own FCAC page still says $1M and is stale.
- Sixplex permission in Ward 11 is **detached only**.

Updating any of these from memory or from a training-data prior will silently corrupt every dollar
figure in the app while the tests still pass. If a value looks wrong, say so — do not change it.

**`lib/listPriceStrategy.ts` ratios are empirical**, derived from specific named comps in
`public/data/comps-university-c01.csv`. Each carries its own `n` and confidence. They are not tuning knobs.
Changing one means claiming new evidence — cite the comp.

## Testing

```bash
npm test     # 103 tests, all must stay green
npm run dev  # http://localhost:3000
```

**Never edit a test to make it pass.** These tests encode market findings, not implementation
details — for example that a relist caps the prediction at the price the market already refused. A
red test means the code is wrong or the finding changed. If you believe a test is genuinely stale,
flag it rather than rewriting it.

## Conventions

- Calculations live in `lib/` as pure functions with no React. UI never does arithmetic.
- Canadian fixed-rate mortgages compound **semi-annually**. `monthlyPayment()` handles this; the US
  `rate/12` shortcut overstates the payment and these numbers gate a pass/fail decision.
- The parser in `lib/parseListing.ts` must never silently guess. Everything it reads is returned in
  `found` with the source text, and anything it cannot determine goes in `missing`.
- Prefer showing a range with its sample size over a point estimate. Small `n` gets said out loud.
- Money is formatted with `money()` from `components/Field.tsx`.
- Colours come from CSS custom properties in `app/globals.css` (Areia / Verde Opaco / Terra Queimada
  / Azul). No hard-coded hex in components.

## Where the judgment calls live

Do not decide these in code without asking: which comps to trust, what the calibration ratios should
be, what a gate should fail on, or whether a specific property is worth bidding on. One of the 23
original comps (46 Brunswick) turned out to be materially misleading — see
`listings/46-brunswick-ave.md`.

<!-- END:house-check-project-rules -->
