import { describe, it, expect } from 'vitest';
import { evaluate, cashToClose, weightedPillarScore, disagreements } from '../evaluate';
import { DEFAULT_PROFILE, type Listing, type BuyerProfile } from '../types';

function listing(over: Partial<Listing> = {}): Listing {
  return {
    id: 'test',
    address: '138 Major St',
    listPrice: 999_000,
    daysOnMarket: 7,
    type: 'Att/Row/Twnhouse',
    onResilientCorridor: true,
    secureBikeStorage: true,
    northOfDavenport: false,
    metresToProtectedLane: 150,
    heritage: 'none',
    suite: 'none',
    abutsLaneway: true,
    ...over,
  };
}

const profile: BuyerProfile = { ...DEFAULT_PROFILE, cashAvailable: 900_000, plannedDownPayment: 400_000 };

describe('cash to close', () => {
  it('forces the down payment up to the legal minimum', () => {
    const c = cashToClose(1_600_000, { ...profile, plannedDownPayment: 100_000 });
    expect(c.downPayment).toBeCloseTo(320_000, 2); // 20% at $1.6M
  });

  it('leaves the planned down payment alone when it clears the minimum', () => {
    const c = cashToClose(1_400_000, { ...profile, plannedDownPayment: 400_000 });
    expect(c.downPayment).toBe(400_000);
  });

  it('reports what is left after closing', () => {
    const c = cashToClose(1_400_000, profile);
    expect(c.cashRemaining).toBeCloseTo(900_000 - c.total, 2);
    expect(c.total).toBeGreaterThan(400_000);
  });

  it('goes negative when the cash is not there', () => {
    const c = cashToClose(1_500_000, { ...profile, cashAvailable: 200_000, plannedDownPayment: 300_000 });
    expect(c.cashRemaining).toBeLessThan(0);
  });
});

describe('evaluate', () => {
  it('models the predicted landing price, not the ask', () => {
    const ev = evaluate(listing(), profile);
    expect(ev.modelledPrice).toBeGreaterThan(1_250_000);
    expect(ev.cash.purchasePrice).toBe(ev.modelledPrice);
  });

  it('fails the bike gate when the score is too low', () => {
    const ev = evaluate(
      listing({ metresToProtectedLane: 2000, onResilientCorridor: false, secureBikeStorage: false, northOfDavenport: true }),
      profile,
    );
    expect(ev.gates.find((g) => g.name === 'Bikeability')!.state).toBe('fail');
    expect(ev.verdict).toBe('walk');
  });

  it('flags a resilience gap when the route depends on at-risk lanes', () => {
    const ev = evaluate(listing({ onResilientCorridor: false }), profile);
    expect(ev.bike.resilienceGap).toBeGreaterThan(10);
    expect(ev.flags.join(' ')).toMatch(/legally free to remove/);
  });

  it('walks on a recorded deal-breaker regardless of everything else', () => {
    const ev = evaluate(listing({ dealBreaker: 'On Bathurst, too loud' }), profile);
    expect(ev.verdict).toBe('walk');
  });

  it('flags an unverified suite', () => {
    const ev = evaluate(listing({ suite: 'existing-unverified', kitchens: 2 }), profile);
    expect(ev.flags.join(' ')).toMatch(/no public registry/i);
  });

  it('flags that sixplex permission does not reach a semi', () => {
    const ev = evaluate(listing({ type: 'Semi-Detached', abutsLaneway: true }), profile);
    expect(ev.flags.join(' ')).toMatch(/detached-only/);
  });

  it('flags thin detached comp support', () => {
    const ev = evaluate(listing({ type: 'Detached' }), profile);
    expect(ev.flags.join(' ')).toMatch(/thinly supported/i);
  });

  it('warns rather than passing when the price is in the stretch band', () => {
    // $1.35M list is priced-to-market, predicted ~$1.28M — inside the ceiling.
    const under = evaluate(listing({ listPrice: 1_350_000, daysOnMarket: 40 }), profile);
    expect(under.gates.find((g) => g.name === 'Price')!.state).toBe('pass');

    // $1.75M list, fast-moving, predicts above the ceiling.
    const over = evaluate(listing({ listPrice: 1_750_000, daysOnMarket: 5 }), profile);
    expect(['warn', 'fail']).toContain(over.gates.find((g) => g.name === 'Price')!.state);
  });

  it('shows the condo-empty branch as the worse case', () => {
    const ev = evaluate(listing(), { ...profile, condoExpectedRent: 3_000 });
    expect(ev.carryEmpty.effectiveMonthly).toBeGreaterThan(ev.carryRented.effectiveMonthly);
  });

  it('prefers the listing tax figure over a percentage of price', () => {
    const withTax = evaluate(listing({ annualPropertyTax: 4_800 }), profile);
    expect(withTax.carryEmpty.propertyTaxMonthly).toBeCloseTo(400, 2);
  });
});

describe('pillar scoring', () => {
  it('returns null with no scores', () => {
    expect(weightedPillarScore(undefined, DEFAULT_PROFILE.weights)).toBeNull();
    expect(weightedPillarScore({}, DEFAULT_PROFILE.weights)).toBeNull();
  });

  it('averages two scorers and normalises to 100', () => {
    const s = weightedPillarScore(
      {
        Paul: { location: 5, size: 5, growth: 5, income: 5 },
        Armando: { location: 5, size: 5, growth: 5, income: 5 },
      },
      DEFAULT_PROFILE.weights,
    );
    expect(s).toBeCloseTo(100, 6);
  });

  it('surfaces only meaningful disagreements', () => {
    const d = disagreements({
      Paul: { location: 5, size: 3, growth: 4, income: 2 },
      Armando: { location: 2, size: 3, growth: 4, income: 5 },
    });
    expect(d.map((x) => x.pillar)).toEqual(['location', 'income']);
    expect(d[0].gap).toBe(3);
  });
});

describe('unmeasured bikeability', () => {
  it('does not fail a listing merely because distance was not entered', () => {
    const ev = evaluate(listing({ metresToProtectedLane: undefined }), profile);
    const gate = ev.gates.find((g) => g.name === 'Bikeability')!;
    expect(ev.bike.assessed).toBe(false);
    expect(gate.state).toBe('warn');
    expect(ev.verdict).not.toBe('walk');
  });

  it('still fails once measured and genuinely poor', () => {
    const ev = evaluate(
      listing({ metresToProtectedLane: 2000, onResilientCorridor: false, secureBikeStorage: false }),
      profile,
    );
    expect(ev.bike.assessed).toBe(true);
    expect(ev.gates.find((g) => g.name === 'Bikeability')!.state).toBe('fail');
  });
});

describe('offer-night hold-back overrides the price band', () => {
  it('predicts above ask for a hold-back listed above the band', () => {
    const withHold = evaluate(listing({ listPrice: 1_390_000, daysOnMarket: 8, holdbackOffers: true }), profile);
    const without = evaluate(listing({ listPrice: 1_390_000, daysOnMarket: 8 }), profile);
    expect(withHold.modelledPrice).toBeGreaterThan(1_390_000);
    expect(without.modelledPrice).toBeLessThanOrEqual(1_390_000 * 1.001);
    expect(withHold.strategy.confidence).toBe('low');
    expect(withHold.strategy.n).toBe(3); // 281 Brunswick, 365 Shaw, 46 Brunswick
  });

  it('turns a passing price gate into a warning once the prediction clears the ceiling', () => {
    // At the recalibrated +6.4% median, $1.39M lands at ~$1.479M — still inside
    // the $1.5M ceiling. $1.45M lands at ~$1.543M and should trip the gate.
    const inside = evaluate(listing({ listPrice: 1_390_000, daysOnMarket: 8, holdbackOffers: true }), profile);
    expect(inside.modelledPrice).toBeLessThan(profile.budgetCeiling);
    expect(inside.gates.find((g) => g.name === 'Price')!.state).toBe('pass');

    const over = evaluate(listing({ listPrice: 1_450_000, daysOnMarket: 8, holdbackOffers: true }), profile);
    expect(over.modelledPrice).toBeGreaterThan(profile.budgetCeiling);
    expect(over.gates.find((g) => g.name === 'Price')!.state).toBe('warn');
  });

  it('reproduces the 365 Shaw outcome inside its predicted range', () => {
    // 365 Shaw: listed $1,349,000 with an Aug 26 offer date, sold $1,435,000 (+6.4%).
    const ev = evaluate(listing({ listPrice: 1_349_000, daysOnMarket: 2, holdbackOffers: true }), profile);
    expect(ev.strategy.predicted!.low).toBeLessThanOrEqual(1_435_000);
    expect(ev.strategy.predicted!.high).toBeGreaterThanOrEqual(1_435_000);
    expect(Math.abs(ev.modelledPrice - 1_435_000) / 1_435_000).toBeLessThan(0.01);
  });

  it('leaves the well-calibrated band alone', () => {
    const a = evaluate(listing({ listPrice: 999_000, holdbackOffers: true }), profile);
    const b = evaluate(listing({ listPrice: 999_000 }), profile);
    expect(a.modelledPrice).toBeCloseTo(b.modelledPrice, 2);
    expect(a.strategy.n).toBe(5);
  });
});

describe('property type changes the land transfer tax', () => {
  it('keeps the graduated tiers for a duplex but not a triplex', () => {
    const duplex = evaluate(listing({ type: 'Duplex', listPrice: 2_200_000 }), profile);
    const triplex = evaluate(listing({ type: 'Triplex', listPrice: 2_200_000 }), profile);
    expect(triplex.cash.ontarioLtt).toBeLessThan(duplex.cash.ontarioLtt);
    expect(triplex.cash.torontoMltt).toBeLessThan(duplex.cash.torontoMltt);
  });

  it('treats a detached house as one or two family', () => {
    const a = evaluate(listing({ type: 'Detached', listPrice: 2_200_000 }), profile);
    const b = evaluate(listing({ type: 'Duplex', listPrice: 2_200_000 }), profile);
    expect(a.cash.ontarioLtt).toBeCloseTo(b.cash.ontarioLtt, 2);
  });
});
