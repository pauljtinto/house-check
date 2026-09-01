# TODO — good tasks to hand a coding agent

Each of these is self-contained, has clear acceptance criteria, and is verifiable by running the
tests. Do them one at a time and keep `npm test` green.

**Read `AGENTS.md` first.** In particular: `lib/assumptions.ts` is read-only, and tests are not to be
edited into passing.

---

## 1. Wire the comps into the app — DONE

Built. The CSV now lives at `public/data/comps-university-c01.csv` (single source of truth: the app
fetches it, the tests read it from disk). `lib/comps.ts` parses it and computes bands;
`components/Comparables.tsx` renders them. Original brief: The
list-price classifier was calibrated from it by hand; the app itself has no comps feature.

Build:
- A loader in `lib/comps.ts` that parses the CSV (ship it as a typed import or `fetch` from `public/`)
- A fair-value band per property type: adjusted $/sqft where square footage exists, median and IQR
- A `ComparablesPanel` component showing where the current listing's predicted landing sits against
  the band for its own type

**Segment by property type before averaging.** Semi and detached medians differ by about $925k in
this data; blending them describes no actual house.

Acceptance: given a semi at a predicted $1.5M, the panel shows the semi band ($1.5M median, n=13) and
says the listing sits at the median. Tests cover the band maths and the type segmentation.

---

## 2. Stretch-cost panel — DONE

`stretchTaxTable()` in `lib/landTransferTax.ts` is written and tested but never rendered.

Show, for any listing predicted above the budget ceiling: price, extra land transfer tax, extra
down payment required, extra monthly carry, and where the reserve floor breaks. Marginal LTT is 4%
combined to $2M and 5% above it, so each $100k over $1.5M costs $4,000 in tax alone.

Acceptance: the panel appears only when the prediction exceeds the ceiling, and the $1.5M → $1.6M row
shows exactly $4,000 of extra tax.

---

## 3. Compare view — DONE

A table across all saved listings: address, ask, predicted landing, verdict, cash to close, effective
monthly carry (condo-empty branch), bikeability score, and any red gate. Sortable. This is what you
actually take to a decision.

Acceptance: adding a listing adds a row; deleting removes it; the verdict dot colours match the rail.

---

## 4. Investment case  (§6 of PLAN.md — designed but never built)  <- start here

The comparison is **buy the house and keep the condo** vs **stay in the condo and invest the
difference** at the expected portfolio return. Not rent-vs-buy — the condo is not being sold.

Outputs: break-even year after ~5% selling costs; equity at 5 and 10 years under bear 0% / base 2.5%
/ bull 5%; total cost of ownership; opportunity cost of the down payment; renewal sensitivity at +1%,
+2%, +3%.

Pure functions in `lib/investment.ts` with tests, then a panel. Constants already live in
`DEFAULTS` in `lib/assumptions.ts`.

Acceptance: break-even year is a single number, and the renewal sensitivity table shows the carry at
each stressed rate.

---

## 5. Print a one-pager

Print CSS so ⌘P produces a clean single page for the agent or broker: verdict, price reality, gates,
cash to close, carry, flags. Hide the editor, the rail, and the placeholder banner.

Acceptance: print preview is one page, no clipped tables, legible in greyscale.

---

## 6. Export / import JSON

Everything lives in `localStorage` and one cleared browser wipes it. Add a download of
`{profile, listings}` and a matching file import, with the schema version stamped.

Acceptance: export, clear storage, re-import, and every listing and score comes back.

---

## Not agent work — ask first

- Changing calibration ratios in `lib/listPriceStrategy.ts`
- Anything in `lib/assumptions.ts`
- Deciding what a gate fails on
- Whether a specific property is worth bidding on

## Known gaps that need research, not code

- Only 2 of 24 comps are detached, so the model can barely price detached property
- No Trinity Bellwoods comp set yet
- No lot dimensions or square footage on most comps — needed for land-share and laneway feasibility
- Bikeability is manual entry; automating it needs the Toronto Open Data `cycling-network` layer and
  NRCan HRDEM elevation (sources listed in `PHASE-0-FINDINGS.md` §8)
