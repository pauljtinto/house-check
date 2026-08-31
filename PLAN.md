# House Check — Planning Doc

**A tool to answer one question: is this house a reasonable purchase for Paul and Armando?**

Status: planning. Nothing built yet.
Last updated: 2026-08-30 (rev 3 — neighbourhoods set, bikeability as a gate, soft ceiling)

---

## 1. What this is

Paste in a Toronto listing. Get back a verdict — **buy / stretch / walk** — built from hard gates, four value pillars, and three financial tests.

**Hard gates. Any one fails, the house is out — no score can rescue it.**

| Gate | Test |
|---|---|
| **Bikeability** | Below the bikeability threshold = walk. Non-negotiable. |
| **Neighbourhood** | Inside the target areas, or a deliberate exception |
| **Cash floor** | Cash-to-close leaves the reserve intact |

**Four value pillars — what we're actually buying:**

| Pillar | The question |
|---|---|
| **Location** | Right place to be for the next 10+ years? |
| **Size** | Fits us now, and has room to fit us later? |
| **Growth potential** | Will *this* property beat the neighbourhood average? |
| **Income potential** | Can it help pay for itself? |

**Three financial tests — sized, not pass/fail:**

Affordability and stretch cost · Price fairness vs. comps · Investment case vs. staying put

The distinction matters: most bad purchases happen when a gate quietly fails while everyone argues about a pillar.

---

## 2. What's settled

- **Neighbourhoods: the Annex, around U of T, and Trinity Bellwoods.** Proximity to the practice at St. Clair & Dufferin is *not* a criterion — dropped from the model entirely.
- **Bikeability is a hard requirement.** Subway and streetcar access are strongly preferred but scored, not gated.
- **Pre-approved to a $1.5M purchase price** on Paul's income alone. **This is a soft ceiling** — going above is allowed if the numbers justify it. See §4.
- **Down payment is ready.** No portfolio liquidation, no HELOC increase, no realized capital gains to model.
- **Armando's income is not in the financing.**
- **The condo is not being sold.** No bridge, no sale proceeds, and no Smith Manoeuvre unwind — the HELOC and the XEI/VDY position stay intact. Whether it gets rented is still open, so the model runs both branches.
- **Both on title. Armando is Canadian but not a Canadian tax resident.** Resolves two large risks, creates several small ones — see §8.
- **Comparables to be supplied by Paul.** Feeds price fairness directly; no scraping required.

---

## 3. Gates and pillars

### Gate: Bikeability

Stated as a must, so it's modeled as one. Scored 0–100; below a threshold you set, the listing fails outright regardless of everything else.

Inputs:

- **Distance to the nearest protected bike lane**, and to a continuous protected route — a lane you have to cross four lanes of traffic to reach isn't the same as a lane on your street
- **Network connectivity** — Bloor, Harbord, College, Shaw, Adelaide/Richmond, the West Toronto Railpath, the Martin Goodman Trail. Harbord in particular is the spine that ties all three target neighbourhoods together.
- **Bike times to real destinations** you nominate — not an abstract score
- **Topography.** This matters more than people expect in these areas. The Davenport escarpment — the old Lake Iroquois shoreline — is a genuine climb. A property north of Davenport is a materially different daily ride from one south of it, and no walk-score-style metric captures that. The app should compute elevation gain on the actual routes.
- **Secure bike storage at the property** — garage, shed, laneway access, ground-floor space. A property-level factor, not just a location one, and it's the difference between cycling daily and cycling sometimes.
- **Winter viability** — is the primary route on the city's priority clearing network?

> **⚠️ Verify in phase 0:** Provincial legislation has directed the removal of bike lanes on Bloor, Yonge, and University, and that has been through litigation. As of this writing the status is unresolved. For a bikeability-first buyer in the Annex this is not a detail — **Bloor is the east-west spine of that neighbourhood.** The current legal status needs to be established before this pillar is scored, and if Bloor's lanes are genuinely at risk, that shifts weight decisively toward Harbord-adjacent properties. Flag it in the app rather than burying it in an assumptions file.

### Location
*Scored, with computed inputs.*

- Subway proximity (Bloor-Danforth and University lines both serve these areas) and streetcar access (College, Dundas, Queen, Ossington, Bathurst)
- Walkability and amenities
- Street quality — arterial vs. quiet residential is a persistent, measurable value gap, and in these neighbourhoods it's the difference between Palmerston and Bathurst
- Neighbourhood trajectory: 5- and 10-year appreciation vs. city average
- Airport access for NYC runs — Billy Bishop is genuinely close from all three areas, which is worth something real given Armando
- Noise and student-density exposure near campus — cuts both ways: it depresses quality of life and raises rental income

### Size
*Mostly measured.*

- Interior sqft, split above vs. below grade — below-grade is worth roughly half, and the app should not let a listing's headline sqft flatter itself
- Beds, baths, and whether the layout supports two workable home offices
- Lot: frontage × depth. In these neighbourhoods lots are narrow and deep; frontage is the scarce dimension and drives value more than total area.
- Guest space — Armando's people, your family
- **Expandability** — rear addition, third storey, dig-out. Scarce here (tight setbacks, attached walls, heritage constraints), which makes it *more* valuable when present, not less.

### Growth potential
*The pillar most people hand-wave, and the one with the most signal.*

- **Land share of price.** Lot area × neighbourhood land $/sqft vs. ask. These are high-land-share areas by nature — you're buying dirt and location, with a 100-year-old structure attached. The ratio still discriminates between listings.
- **Under-improvement.** Price vs. the street's median. The worst house on Palmerston has upside the best house on a lesser street does not.
- **Zoning headroom.** Toronto permits multiplexes up to four units as-of-right across residential neighbourhoods, plus laneway and garden suites where geometry allows. A lot that can legally hold more than it currently does carries option value even if you never build.
- **⚠️ Heritage constraints.** Parts of the Annex sit in heritage conservation districts, and individual properties may be listed or designated. This meaningfully limits exterior alteration and expansion — it can gut both the growth and income pillars for a specific address. **The app must check heritage status per listing, not per neighbourhood.** This is the most common way a promising Annex property turns out to be a bad one.
- **Renovation upside** — cost to renovate vs. value added, flagged where the reno is value-destructive
- **Infrastructure catalysts** nearby

Expressed as a **dollar range of option value** wherever inputs support it, not just a 1–5.

### Income potential
*In these three neighbourhoods this pillar is unusually live.*

- **Existing suite or conversion** — and critically, *legal* vs. as-is. A legal second suite (separate entrance, egress, ceiling height, fire separation) is worth far more than an "in-law setup," in both rent and resale. Asked explicitly, never assumed. Many houses in these areas were long ago converted to multiplexes or student rentals; some conversions are legal and some aren't, and the difference is expensive.
- **U of T rental demand.** Proximity to campus is a durable, recession-resistant rental market. It's arguably the strongest income argument in the whole target area.
- **Laneway suite feasibility.** The Annex and Trinity Bellwoods are laneway-dense — this is a real option here, not a theoretical one. Modeled as a scenario with a build-cost range and rent estimate, clearly labelled speculative. Garden suites are less likely given lot sizes.
- **Whole-home rental during a NYC stretch.** Toronto's short-term rental rules cap entire-home rentals at 180 nights a year and require it be your principal residence — which lines up almost exactly with a six-month sabbatical. Needs proper checking, but the shape fits.
- **Effective carry** = monthly carry − realistic net rental income. Shown alongside the raw figure, never instead of it.

---

## 4. Affordability and the stretch band

The pre-approval sets a $1.5M reference price, but you've said above is possible if it makes sense. So the model treats it as three zones:

| Zone | Behaviour |
|---|---|
| **Under $1.5M** | Normal. Financing already proven. |
| **$1.5M – stretch limit** | Allowed, but the app shows exactly what the stretch costs and what has to be true |
| **Above stretch limit** | Walk |

**What a stretch actually costs.** If the approved *mortgage amount* is fixed, every dollar above $1.5M comes out of cash, dollar for dollar. On top of that, land transfer tax in this range runs about **2% provincially plus 2% municipally — roughly 4% marginal**, so each additional $100K of price costs about **$4,000 in extra tax alone**, before the larger down payment. The app should show a plain escalation table: at $1.6M, $1.7M, $1.8M — extra cash needed, extra tax, extra monthly carry, and where the reserve floor breaks.

**The question that sets the stretch limit:** the pre-approval is expressed as a $1.5M *purchase price*, but what governs a stretch is the approved **mortgage amount**. If the lender approved, say, $1.2M of mortgage, then a $1.7M purchase simply needs $500K down and may need no new approval at all. If they capped the mortgage tighter, the stretch is much more expensive. **One question to the broker resolves this**, and it's the highest-value unknown left in the financial model.

Also worth knowing: at $1.5M and above, mortgage insurance is unavailable and 20% down is the minimum — already your situation, so it constrains nothing.

### Cash to close
Down payment + Ontario LTT + Toronto MLTT + legal + title insurance + inspection + tax adjustments.

At $1.5M, Ontario and Toronto each charge roughly **$26,500 — about $53,000 combined**, in cash on closing day. No first-time-buyer rebate. *(Bracket math verified in phase 0.)*

The gate: cash-to-close leaves you above a reserve floor set in advance and not crossed.

### Carry
P&I + property tax + insurance + utilities + maintenance reserve (1%/yr default), **plus the condo's full carrying cost**, minus condo rent if rented, minus suite income if any.

Both branches always shown together. The condo-empty branch is the one to stress-test — it's what happens when a tenant falls through.

> **Property tax note:** Toronto bills off MPAC assessed values still anchored to 2016. Tax on a $1.5M house is often based on a much lower number. Use the listing's actual tax figure, and flag it when it looks inconsistent with the ask.

---

## 5. Price fairness

You're supplying the comparables, which removes the hardest data problem in the app. What the tool does with them:

- Adjusted $/sqft per comp, with below-grade discounted and frontage weighted
- Median and spread → a **fair-value band**, never a point estimate
- Ask vs. band, in dollars and percent
- Days on market vs. neighbourhood norm, and what that's worth in negotiating room
- Price-cut and relisting history
- **Semi vs. detached segmentation.** In these neighbourhoods the two trade as different markets, and blending them into one $/sqft average produces a number that describes no actual house. Comps get segmented by type before anything is averaged.

**Upload the comps whenever you're ready** — any format, spreadsheet or pasted text. They'll set the real price bands for each neighbourhood, which in turn calibrates the stretch limit far better than a guess would.

---

## 6. Investment case

With the condo staying, the rent-vs-buy framing is wrong. The real comparison:

> **Buy the house and keep the condo** — versus — **stay in the condo and invest the difference** at your expected portfolio return.

Outputs:

- **Break-even year**, after transaction costs both ways (~5% to sell)
- Equity at 5 and 10 years under bear (0%) / base (2.5%) / bull (5%) appreciation
- Total cost of ownership over the hold period
- Opportunity cost of the down payment at your five-factor expected return
- **Renewal sensitivity** — carry at +1%, +2%, +3%
- **Side-by-side against the practice building** as a competing use of the same capital

---

## 7. Output

One page per listing:

- **Verdict banner** — buy / stretch / walk, and the numbers that drove it
- **Gate strip** — bikeability, neighbourhood, cash floor. Any red is a stop.
- **Pillar radar** — four pillars, your score and Armando's overlaid, disagreements highlighted. Where you disagree is the most useful thing on the page.
- **Stretch panel** for anything over $1.5M — what it costs, what has to be true
- **"What would have to be true"** — *this works at $1.58M, or if the basement suite is legal, or if the laneway suite pencils.* More useful than a score.
- Flags: heritage designation, suite legality unconfirmed, reserve floor breached, tax figure inconsistent, condo-empty branch fails
- Compare view across all saved listings

---

## 8. Cross-border: Armando on title as a non-resident

**The two big risks from earlier revisions are gone.** Ontario's Non-Resident Speculation Tax and the federal foreign-buyer ban both key off citizenship — non-citizens and non-permanent-residents. A Canadian citizen is exempt from both regardless of where they pay tax. No 25% NRST exposure.

**Non-residency creates friction at the exit and on rental income.** All manageable; none a dealbreaker. Worth modeling rather than discovering:

1. **Withholding on eventual sale.** A non-resident disposing of Canadian real property triggers a buyer withholding obligation on their share of gross proceeds unless a CRA clearance certificate is obtained first, and that takes months. Plan for it.

2. **Principal residence exemption.** The PRE generally requires Canadian residency for the years claimed, so Armando's share of the gain may not be fully shelterable for non-resident years. **The most consequential item here**, and the strongest argument for setting the ownership split deliberately at purchase rather than defaulting to 50/50.

3. **Rental income.** If either property is rented with Armando on title, his share of gross rent faces non-resident withholding unless the right election is filed to be taxed on net income. Needs setting up before the first rent cheque. Note this interacts directly with the income-potential pillar — a laneway suite is worth slightly less after this friction.

4. **US side.** As a US tax resident Armando reports worldwide income; Canadian property and gains flow into US returns with foreign tax credits. There's also a known trap where a US person holding a foreign-currency mortgage can realize a taxable currency gain on repayment or refinancing. Obscure, real, one for a cross-border accountant.

5. **Ownership structure.** Joint tenancy vs. tenants-in-common, and the split, drive most of the above. Cheap to get right on day one, expensive to change later.

**Action:** none of this stops a purchase, and the app should say so plainly rather than throwing alarms. But items 2 and 5 want an hour with a cross-border accountant *before* an offer.

---

## 9. Stack

Next.js 15 (App Router) + TypeScript + Tailwind — same shape as your treatment-plan dashboard. Runs locally with `npm run dev`.

- `lib/` — pure calculation modules, no React, **unit tested with Vitest**. The math is the product; it gets tests before a UI.
- `lib/assumptions.ts` — every rate, bracket and default in one dated file
- Storage: local JSON to start. Supabase later if Armando wants to score listings from NYC.
- Parsing: pasted listing text → per-source heuristics (realtor.ca, HouseSigma, Zolo). Always shows what it parsed for correction — never silently guesses.
- Bikeability and topography need a routing/elevation data source. Phase 0 decides which; a local dataset is preferable to an API dependency for something this central.

---

## 10. Build order

| Phase | What | Why |
|---|---|---|
| **0** | Verify rates, brackets, zoning, heritage sources, **and the Bloor bike-lane status**; pick the routing/elevation source; fill `assumptions.ts` with dated sources | Everything downstream depends on it |
| **1** | Calculation engine + tests, no UI | The math is the product |
| **2** | Manual entry form + verdict page | End-to-end and correct, if ugly |
| **3** | Comps ingest + fair-value band (your list) | First real output |
| **4** | Bikeability scoring with routing and elevation | The gate — needs to be right |
| **5** | Paste parser with a correction step | Convenience, after correctness |
| **6** | Two-person pillar scorecard + disagreement view | |
| **7** | Growth and income modeling — land share, heritage check, laneway scenarios | Where this stops being a calculator |
| **8** | Compare listings, export a one-pager for your agent | |
| **9** | *Optional:* Supabase sync for Armando | |

---

## 11. Open questions

1. **Approved mortgage amount** (not the $1.5M price cap) — sets the true cost of stretching. One question to the broker. **Highest value.**
2. **Down payment amount** — needed to compute cash-to-close and the stretch table.
3. **Reserve floor** — the cash number you won't go below after closing. Sets the hard stop.
4. **Stretch limit** — the price above which it's a walk regardless. Your comps will help calibrate this.
5. **Bikeability threshold** — what's the minimum acceptable score, and which destinations should routes be measured to?
6. **Pillar weights.** How do location, size, growth and income trade off? Worth you and Armando setting these separately, then comparing, before you discuss.
7. **Condo carrying cost and realistic market rent** — for both branches.
8. **Property type** — semi, detached, or open? At this budget in these three areas that's a live constraint, and your comps will make it concrete.
9. **Timeline** — this fall, spring, or opportunistic?
10. **Is the practice building purchase still live**, or shelved?

---

## 12. What this tool is not

Not mortgage, tax, or legal advice, and no substitute for your broker, a cross-border accountant, or a real estate lawyer. It's a model: it makes assumptions explicit and does the arithmetic consistently, so the professionals get sharper questions from you. The ownership-structure and principal-residence questions in §8 want a real answer before an offer goes in.

Rules change, and the bike-lane and zoning items above are actively contested. Every figure in `assumptions.ts` carries a verification date; anything stale gets re-checked before you rely on it.
