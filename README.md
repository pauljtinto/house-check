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
lib/comps.ts             comp set loader + fair-value bands by property type
lib/evaluate.ts          pulls it together into a verdict
app/page.tsx             the UI
public/data/             the comp set (fetched by the app, read by the tests)
```

Listings and your profile are saved in browser localStorage. Nothing leaves your machine.

## Read first

- `PLAN.md` — what this is and why
- `COMPS-ANALYSIS.md` — the 23-comp analysis the predictions rest on
- `PHASE-0-FINDINGS.md` — verified rules, and four things that changed the plan

## Hosting and access

Deployed on Vercel from `github.com/pauljtinto/house-check`. The loop is: commit locally, push to
`main`, Vercel builds and deploys. Nothing else syncs — see below.

**Listings do not travel.** They live in browser `localStorage`, which is per-origin and per-browser.
`localhost:3000`, `localhost:3001` and the Vercel URL are three separate stores, and nothing reaches
Armando's laptop. Use the "Load the 3 listings we analysed" button in the rail to seed any browser.

**Indexing is handled; access is not.** `X-Robots-Tag: noindex` is set on every response in
`next.config.ts`, plus a blanket `Disallow` in `app/robots.ts`. Vercel adds noindex to preview
deployments automatically but *not* to current production, and this app serves MLS sold data at
`/data/comps-university-c01.csv`. That keeps it out of search results — it does **not** stop anyone
with the URL from reading it.

**To actually restrict access**, on the Hobby plan Vercel Authentication only offers Standard
Protection, which explicitly leaves the production domain public. The real options are: Pro at
$20/month with the scope set to All Deployments (a second person can be a free Viewer seat); or stay
on a non-production branch with Standard Protection and use the branch URL; or hand-roll a password
gate. Note that Next.js 16 renamed `middleware.ts` to `proxy.ts` — a stale `middleware.ts` silently
stops running, which would remove an auth gate without any build error.

## Caveats

Not mortgage, tax or legal advice. Rates verified 2026-08-31; re-check anything older than a few
months. Predictions rest on small samples (n=5 for the offer-night band) and every estimate shows its
own n and confidence. The financial defaults in `lib/types.ts` marked PLACEHOLDER are guesses —
replace them under "Your numbers" before believing any dollar figure.
