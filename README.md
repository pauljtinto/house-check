# House Check

Is this a reasonable purchase for Paul and Armando? Toronto — Annex, U of T, Trinity Bellwoods.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # 49 tests
```

## What it does

Enter a listing, get a verdict — **buy / stretch / walk** — from three hard gates and four value pillars.

The core idea: **in this market the list price is a marketing decision, not a valuation.** Every comp
listed between $989k and $1.199M sold 19.7–42.0% over ask; everything listed above $1.5M sold at a
median 94.6% of ask. So the app models the *predicted landing price*, never the ask. A $1.2M listing
can fail your $1.5M ceiling while a $1.55M listing passes.

## Layout

```
lib/assumptions.ts       every rate and bracket, dated + sourced  ← start here
lib/landTransferTax.ts   Ontario + Toronto MLTT (incl. the April 2026 changes)
lib/mortgage.ts          down payment tiers, stress test, semi-annual compounding
lib/listPriceStrategy.ts the offer-night classifier, calibrated on 23 comps
lib/bikeability.ts       the hard gate, with Bill 212 resilience scoring
lib/evaluate.ts          pulls it together into a verdict
app/page.tsx             the UI
data/                    the comp set
```

Listings and your profile are saved in browser localStorage. Nothing leaves your machine.

## Read first

- `PLAN.md` — what this is and why
- `COMPS-ANALYSIS.md` — the 23-comp analysis the predictions rest on
- `PHASE-0-FINDINGS.md` — verified rules, and four things that changed the plan

## Caveats

Not mortgage, tax or legal advice. Rates verified 2026-08-31; re-check anything older than a few
months. Predictions rest on small samples (n=5 for the offer-night band) and every estimate shows its
own n and confidence. The financial defaults in `lib/types.ts` marked PLACEHOLDER are guesses —
replace them under "Your numbers" before believing any dollar figure.
