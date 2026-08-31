# Phase 0 — Verification Findings

**Verified 2026-08-31.** Every figure below is now encoded in `lib/assumptions.ts` with its source and date. Three things in the earlier plan turned out to be wrong, and one thing changed in the world two weeks ago.

---

## 1. ⚠️ The bike lane case was decided — and the province won

**On 14 August 2026 the Court of Appeal for Ontario unanimously overturned the ruling that had blocked bike lane removals.** *Cycle Toronto v. Ontario (AG)*, 2026 ONCA 582. Justice Huscroft, writing for the panel: **"There is no Charter right to bicycle lanes."** Section 7 does not oblige the state to provide harm-reduction infrastructure, and legislatures are as free to remove lanes as to build them.

**The injunction is dissolved. Removal of the Bloor, Yonge and University lanes is now legally permitted.** No physical removal has been confirmed as of ~18 August, and the Minister announced no timeline, but the legal barrier is gone.

Two dates to watch:
- **~4 September** — costs submissions deadline; the next signal on whether Cycle Toronto seeks leave to appeal to the Supreme Court. (A leave application does *not* automatically stay removal.)
- **26 October** — municipal election. Chow vs. Bradford, who vowed on 11 August that Bloor's lanes "are coming out" and promised to remove Yonge's. A Bradford win removes the City's remaining resistance. Eight weeks away.

### But this barely touches Harbord Village — which is the good news

**Harbord/Hoskin is complete, protected, and not named in Bill 212.** Finished November 2025, Ossington to Queen's Park Crescent, ~2.5 km of **poured-in-place concrete cycle track** — not paint and bollards — built as part of a full watermain and road reconstruction. Removing it would mean tearing up a one-year-old rebuild. **College Street** is likewise complete, protected (elevated cycle tracks Manning→Spadina), and untargeted.

**Every one of your 23 comps sits on the Harbord/College corridor.** The bikeability gate survives the worst Bloor scenario intact. Your neighbourhood choice looks better after this ruling than before it.

Two caveats worth carrying: the *eastward* continuation of Harbord into the University/Queen's Park network is in contested territory, and north–south protection is genuinely thin — Shaw and Roxton are decent local connectors, but Spadina, Bathurst and Ossington have no protected cycle tracks. Also, the planned **Dupont bikeway (Spadina→Davenport) has been deferred**, with the provincial legislation cited as the reason.

**Engine design consequence:** the classifier scores every property twice — once with the at-risk corridors, once without — and reports the delta. That "resilience score" is the number that actually matters for you, and no off-the-shelf bike score computes it.

---

## 2. ⚠️ Toronto's land transfer tax changed on 1 April 2026

Council amended the MLTT on 17 December 2025, effective 1 April 2026. The change inserted a **new 2.5% tier from $2M–$3M** and raised the luxury tiers above $3M (from 3.5/4.5/5.5/6.5/7.5% to 4.40/5.45/6.50/7.55/8.60%).

**Every third-party calculator still running the 2024 table understates MLTT above $2M.** Ours doesn't.

At your reference price the brackets are unchanged, so the earlier estimate holds — and is now exact rather than approximate:

| At $1,500,000 | |
|---|---|
| Ontario LTT | $26,475.00 |
| Toronto MLTT | $26,475.00 |
| MLTT admin fee (incl. HST) | $115.89 |
| **Total** | **$53,065.89** |

**Marginal rate matters for the stretch band:** 4.0% combined from $400K to $2M, then **5.0% from $2M to $3M**. So each $100K above $1.5M costs $4,000 in tax alone; above $2M it's $5,000.

Also confirmed: **no first-time buyer rebate** (you own the condo), and the **$1.5M insurance threshold is real** — 20% down minimum at or above it. Note that Canada's own FCAC page still contains stale "$1 million" text contradicting Finance and CMHC; we source from the latter.

---

## 3. ✅ Heritage is a much smaller problem than I thought

I flagged heritage as "structural" for Harbord Village in the last revision. **That was an overstatement, and the correction is in your favour.**

The Harbord Village HCD exists in two designated phases, but their boundaries are narrow:

- **Phase 1 (2005):** Brunswick Ave nos. 10–88 west / 15–101 east (College to Ulster), Willcocks west of Spadina (74–100 N, 81–101 S), Robert St 110–128, Spadina 592–608
- **Phase 2 (2011, By-law 28-2011):** Robert St College to Bloor (8–320), Sussex Ave south side 57–73, Russell St north side 38–50, Spadina Ave west 540–592

**Borden, Major, Lippincott, Ulster, Bathurst, and Brunswick north of Ulster all appear to sit OUTSIDE both districts.** A Phase 3 covering the rest of the neighbourhood was proposed around 2013 and never designated; Harbord Village does not appear on the City's current list of HCD studies in development.

Mapped against your comp set, roughly **five of 23 look likely to be inside an HCD** — 46 Brunswick, 69 Brunswick, 250 Robert, 90 Willcocks, and possibly 63 Sussex. The other 18 look clear. **Verify per address** using the City's Heritage Property Search (`secure.toronto.ca/HeritagePreservation`) — street name alone is not enough, and the distinction between *listed* (60 days' demolition notice only) and *designated* (full alteration permit regime) is large.

What a designation actually costs you, if one applies: exterior alterations visible from the street need a heritage permit; **alterations not visible from the street are deemed automatically approved**; interiors are unregulated; demolition is refused except for structural instability. Rear and third-storey additions are not prohibited outright but **must not break the main roofline ridge as seen from the opposite sidewalk**. Permits are free, and if Council doesn't decide within 90 days the permit is deemed approved.

**Open gap:** neither HCD plan predates laneway suites, so neither contains any rear-yard infill policy. How staff apply them to a proposed laneway suite is genuinely unknowable from published sources. If you get serious about an HCD address with laneway ambitions, email heritageplanning@toronto.ca before you bid.

---

## 4. ⚠️ The sixplex permission mostly doesn't reach you

Good news first: **four units as-of-right, city-wide**, since May 2023. No parking required, exempt from FSI and maximum-storey limits, up to 10 m height. That applies to detached, semi *and* row houses — so it's available on essentially anything you'd buy.

Then the catch. Toronto extended permissions to **five and six units in June 2025**, and Harbord Village is inside the covered area (Ward 11, University–Rosedale). But the sixplex permission is **detached houses only**.

Your budget buys semis and row houses in this neighbourhood — the comps are unambiguous on that. **So the sixplex upside is effectively unavailable to you at this price point.** Plan around fourplex capacity, not six.

---

## 5. ⚠️ I had the sabbatical rental backwards

The plan said Toronto's 180-night short-term rental cap "lines up almost exactly with a six-month sabbatical." That's wrong, and the correction matters.

A short-term rental is defined as **under 28 consecutive days**. A single continuous six-month let is not a short-term rental at all — **no registration, no $390 fee, no 180-night cap, no 6% accommodation tax.** The municipal by-law simply isn't your obstacle.

**The Residential Tenancies Act is.** A six-month tenancy gives the tenant security of tenure: a fixed-term lease does not end on its expiry date, it continues month-to-month automatically, and recovering the house for yourself generally requires an N12 notice with statutory compensation, contestable at the Landlord and Tenant Board. **You could rent the house out for your sabbatical and struggle to get it back.**

The STR path (multiple stays under 28 days, capped at 180 nights, principal residence, registered, 6% MAT) avoids that but is a different business with different work. Both are viable; they're just not the same thing, and the plan conflated them. The app should model them separately and flag the RTA exposure explicitly.

---

## 6. There is no registry of legal second suites

The City states it plainly: *"There is no quick way to tell if your home meets all of the bylaw requirements for a second suite."* Legality spans the Fire Code, Property Standards, Electrical Code and Zoning By-law at once, with no consolidated public record. The only official route is a 311 complaint — an enforcement action, not a buyer's tool.

Given 39% of your comps had two or more kitchens, this is a live and repeated diligence problem. **The checklist for any listing claiming a legal suite:**

1. Building permit history from Toronto Building, with a **closed final inspection**
2. **ESA electrical certificate**
3. Ceiling height ≥ **1.95 m** in a basement suite, over the whole required area
4. 30-minute fire separation (15 if the house has interconnected smoke alarms)
5. Egress — a separate exit is preferable; a shared exit needs the separation plus interconnected alarms
6. Suite ≤ 45% of the dwelling's interior floor area

A listing that says "legal basement apartment" with no closed permit is a red flag, and it's a cheap thing to check before bidding.

---

## 7. ✅ Confirmed clear: NRST and the foreign-buyer ban

Ontario states it directly, and it answers the exact question: *"It is not relevant whether any of the citizens or permanent residents of Canada live in Canada. Whether a Canadian citizen or permanent resident of Canada is considered a 'non-resident' for income tax purposes is not relevant for the NRST."*

Armando is a Canadian citizen, so **no 25% provincial NRST and no 10% Toronto municipal NRST** — the combined 35% exposure I flagged in rev 1 is definitively off the table. The federal ban likewise defines "non-Canadian" by citizenship with no residence test, and expires 1 January 2027 in any case.

**One trap encoded in the engine:** NRST is triggered by *any* foreign transferee, on the **full property value, not a proportionate share**. It's clear as long as the title list stays as planned. If a third party were ever added to title, this needs rechecking.

The non-residency items from §8 of the plan — withholding on eventual sale, the principal residence exemption, rental income withholding — are unaffected and still stand.

---

## 8. Data sources secured

| Need | Source | Notes |
|---|---|---|
| Cycling network | Toronto Open Data, `cycling-network` | 1,581 segments, refreshed 2026-08-10, GeoJSON. `INFRA_HIGHORDER` distinguishes protected cycle track from painted lane — that's the scoring field |
| Elevation | NRCan HRDEM (CanElevation) | **1 m resolution**, Open Government Licence, STAC/WCS API + AWS mirror |
| Lot dimensions | Toronto Open Data, `property-boundaries` | 498,443 polygons, **refreshed daily**. Solves the laneway/garden suite geometry gap |
| Heritage | `heritage-conservation-districts` (polygons) + `heritage-register` | Cross-check against the live search tool — the HCD shapefile resource is labelled 2022 |
| Zoning | Toronto Open Data, `zoning-by-law` | ⚠️ **Only current to 2023-06-18** — predates both the 2025 sixplex and garden suite amendments. Do not compute unit capacity from it without overlaying manually |

No winter bike lane clearing dataset exists — the City publishes nothing machine-readable. We'll proxy it off facility type, since the City states it runs specialized narrow plows for physically separated and raised bikeways.

---

## 9. What got built

`lib/assumptions.ts` — every figure above, dated and sourced.
`lib/landTransferTax.ts` — marginal bracket engine, both statutes, the new April 2026 tiers, non-SFR capping, and the stretch table.
`lib/mortgage.ts` — minimum down payment tiers, insurance availability, stress test, and payment math using **semi-annual compounding** (the Canadian convention; using the US `rate/12` shortcut overstates the payment, which matters when the output is a pass/fail gate).
`lib/listPriceStrategy.ts` — the offer-night classifier calibrated on your 23 comps.

**31 tests passing.** The one that captures the whole point:

> A house listed at **$1.2M** *fails* against a $1.5M ceiling — predicted to land near $1,547,000.
> A house listed at **$1.55M** *passes* — predicted to land near $1,466,000.

The list price inverts the answer. That's the bug in every other tool you could use for this.

---

## 10. Still open

1. **The approved mortgage amount** (not the $1.5M price cap) — still the highest-value unknown. One question to the broker.
2. **Down payment amount** and **reserve floor** — needed before cash-to-close can produce a real number.
3. **Lot dimensions and square footage** for the comp set, and **Trinity Bellwoods comps**.
4. Whether Cycle Toronto seeks leave to appeal (watch ~4 September), and whether any removal work is scheduled.
5. Confirm the laneway suite 5.0 m separation figure with Toronto Building — the published s.150.8 text appears not to have been updated alongside the 2025 garden suite liberalisation, which would leave laneway suites oddly stricter.
