import type { Listing } from './types';

/**
 * The three listings we actually analysed, as data.
 *
 * Listings live in browser localStorage, which is per-origin and per-browser —
 * nothing carries over between machines, and localhost:3000 and localhost:3001
 * are different stores. This seed means a fresh browser is never a blank page,
 * and the written analyses in `listings/` stay reproducible in the app.
 *
 * Every field here came from a real MLS sheet or HouseSigma page. The only
 * estimated values are `metresToProtectedLane`, which is eyeballed from the
 * address, and the pillar scores, which are placeholders at 3 for both people.
 */

const NEUTRAL = { location: 3, size: 3, growth: 3, income: 3 };

export function seedListings(): Listing[] {
  return [
    {
      id: crypto.randomUUID(),
      address: '196 Brunswick Ave',
      listPrice: 1_390_000,
      daysOnMarket: 8,
      type: 'Detached',
      holdbackOffers: true,
      offerDate: 'Sep 2 at 8pm',
      sqftAboveGrade: 1_750,
      beds: 4, // 2 above grade + 2 below — the real constraint
      baths: 3,
      lotFrontageFt: 18,
      lotDepthFt: 120,
      annualPropertyTax: 12_622.26,
      metresToProtectedLane: 300,
      onResilientCorridor: true,
      secureBikeStorage: true,
      northOfDavenport: false,
      heritage: 'unknown',
      kitchens: 1,
      suite: 'addable',
      abutsLaneway: true,
      scores: { Paul: { ...NEUTRAL }, Armando: { ...NEUTRAL } },
      notes:
        'Renovated Victorian flip. Only 2 bedrooms above grade. Lease-to-own furnace and A/C ' +
        '(~$2,224/yr, buyout unknown). Solar ~$3,300/yr in 2025. No survey. See listings/196-brunswick-ave.md',
    },
    {
      id: crypto.randomUUID(),
      address: '46 Brunswick Ave',
      listPrice: 1_498_000,
      soldPrice: 1_600_000,
      daysOnMarket: 3,
      propertyDaysOnMarket: 27,
      originalListPrice: 1_888_000,
      priorTerminations: 2,
      listingHistory: [
        { start: '2026-08-21', end: '2026-08-24', price: 1_600_000, event: 'Sold', mlsId: 'C13702142' },
        { start: '2026-08-11', end: '2026-08-21', price: 1_795_000, event: 'Terminated', mlsId: 'C13663350' },
        { start: '2026-07-28', end: '2026-08-11', price: 1_888_000, event: 'Terminated', mlsId: 'C13614622' },
      ],
      type: 'Semi-Detached',
      sqftAboveGrade: 2_750,
      beds: 4,
      baths: 3,
      lotFrontageFt: 21,
      lotDepthFt: 137,
      annualPropertyTax: 9_011,
      metresToProtectedLane: 250,
      onResilientCorridor: true,
      secureBikeStorage: true,
      northOfDavenport: false,
      heritage: 'unknown',
      kitchens: 2,
      suite: 'existing-unverified',
      abutsLaneway: true,
      estimatedSuiteRentMonthly: 2_400,
      scores: { Paul: { ...NEUTRAL }, Armando: { ...NEUTRAL } },
      notes:
        'The relist trap. Failed at $1,888,000 and $1,795,000 before capitulating to a $1,498,000 ' +
        'relist. The MLS sheet reports "+6.8% in 3 days"; the truth is −15.3% over 27 days. ' +
        'See listings/46-brunswick-ave.md',
    },
    {
      id: crypto.randomUUID(),
      address: '365 Shaw St',
      listPrice: 1_349_000,
      soldPrice: 1_435_000,
      daysOnMarket: 2,
      type: 'Duplex',
      holdbackOffers: true,
      offerDate: 'August 26, 2026',
      sqftAboveGrade: 1_750,
      beds: 4,
      baths: 2,
      lotFrontageFt: 16,
      lotDepthFt: 127,
      annualPropertyTax: 7_461,
      metresToProtectedLane: 50, // on Shaw, which has protected lanes
      onResilientCorridor: true,
      secureBikeStorage: true,
      northOfDavenport: false,
      heritage: 'unknown',
      kitchens: 2,
      suite: 'existing-unverified',
      abutsLaneway: true,
      estimatedSuiteRentMonthly: 2_200,
      scores: { Paul: { ...NEUTRAL }, Armando: { ...NEUTRAL } },
      notes:
        'Trinity Bellwoods. Clean hold-back: listed $1,349,000 with an Aug 26 offer date, sold ' +
        '$1,435,000 (+6.4%). One of the two comps calibrating the hold-back band.',
    },
  ];
}
