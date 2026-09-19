import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseCompsCsv,
  bandForType,
  allBands,
  percentileOf,
  nearestComps,
  assessAgainstComps,
  quantile,
} from '../comps';

// Read the real CSV — the same file the app fetches. No fixture to drift.
const csv = readFileSync(join(process.cwd(), 'public/data/comps-university-c01.csv'), 'utf8');
const comps = parseCompsCsv(csv);

describe('parsing the real comp set', () => {
  it('reads every row', () => {
    expect(comps).toHaveLength(24);
  });

  it('reproduces the source report figures for the original 23', () => {
    // The agent's own sheet states mean $1,653,817 and median $1,500,000.
    const orig = comps.filter((c) => c.ref !== '24').map((c) => c.soldPrice);
    const mean = orig.reduce((a, b) => a + b, 0) / orig.length;
    expect(Math.round(mean)).toBe(1_653_817);
    expect(quantile([...orig].sort((a, b) => a - b), 0.5)).toBe(1_500_000);
  });

  it('carries the 46 Brunswick relist history', () => {
    const c = comps.find((x) => x.address === '46 Brunswick Ave')!;
    expect(c.originalListPrice).toBe(1_888_000);
    expect(c.priorTerminations).toBe(2);
    expect(c.propertyDom).toBe(27);
    expect(c.dom).toBe(3); // the reset counter, kept for contrast
  });

  it('leaves blank cells undefined rather than zero', () => {
    const shaw = comps.find((x) => x.address === '365 Shaw St')!;
    expect(shaw.originalListPrice).toBeUndefined();
    expect(shaw.kitchens).toBeUndefined();
  });

  it('survives an empty or header-only file', () => {
    expect(parseCompsCsv('')).toEqual([]);
    expect(parseCompsCsv('ref,address,list_price,sold_price')).toEqual([]);
  });
});

describe('bands by property type', () => {
  it('segments rather than blending — the whole point', () => {
    const semi = bandForType(comps, 'Semi-Detached')!;
    const detached = bandForType(comps, 'Detached')!;
    expect(semi.n).toBe(13);
    expect(semi.median).toBe(1_500_000);
    expect(detached.n).toBe(2);
    expect(detached.median).toBe(2_425_000);
    // Blending these would describe no actual house.
    expect(detached.median - semi.median).toBeGreaterThan(900_000);
  });

  it('computes a sensible interquartile range for semis', () => {
    const semi = bandForType(comps, 'Semi-Detached')!;
    expect(semi.p25).toBeLessThan(semi.median);
    expect(semi.p75).toBeGreaterThan(semi.median);
    expect(semi.min).toBe(815_000);
    expect(semi.max).toBe(2_150_000);
  });

  it('reports no $/sqft, because the comp set has no square footage', () => {
    const semi = bandForType(comps, 'Semi-Detached')!;
    expect(semi.medianPricePerSqft).toBeUndefined();
    expect(semi.sqftCoverage).toBe(0);
  });

  it('counts relisted comps so they can be shown as suspect', () => {
    const semi = bandForType(comps, 'Semi-Detached')!;
    expect(semi.relistedCount).toBe(1); // 46 Brunswick
  });

  it('returns null for a type with no comps', () => {
    expect(bandForType(comps, 'Other')).toBeNull();
  });

  it('orders all bands by sample size', () => {
    const bands = allBands(comps);
    expect(bands[0].type).toBe('Semi-Detached');
    for (let i = 1; i < bands.length; i++) {
      expect(bands[i - 1].n).toBeGreaterThanOrEqual(bands[i].n);
    }
  });
});

describe('placing a price in the band', () => {
  it('puts the semi median at roughly the middle', () => {
    const p = percentileOf(comps, 'Semi-Detached', 1_500_000)!;
    expect(p).toBeGreaterThan(30);
    expect(p).toBeLessThan(60);
  });

  it('puts a cheap price near the bottom', () => {
    expect(percentileOf(comps, 'Semi-Detached', 900_000)!).toBeLessThan(10);
  });

  it('returns null for an unknown type', () => {
    expect(percentileOf(comps, 'Nonexistent', 1_000_000)).toBeNull();
  });

  it('finds the nearest comps by price', () => {
    const near = nearestComps(comps, 'Semi-Detached', 1_500_000, 3);
    expect(near).toHaveLength(3);
    expect(near.every((c) => c.type === 'Semi-Detached')).toBe(true);
    expect(Math.abs(near[0].soldPrice - 1_500_000)).toBeLessThanOrEqual(
      Math.abs(near[2].soldPrice - 1_500_000),
    );
  });
});

describe('the reading a human gets', () => {
  it('calls out a thin sample rather than pretending to a band', () => {
    const v = assessAgainstComps(comps, 'Detached', 1_500_000);
    expect(v.reading).toMatch(/Only 2 Detached comp/);
    expect(v.reading).toMatch(/anecdote/);
  });

  it('places a semi at the median', () => {
    const v = assessAgainstComps(comps, 'Semi-Detached', 1_450_000);
    expect(v.reading).toMatch(/25th percentile and the median/);
  });

  it('flags the top of the range', () => {
    const v = assessAgainstComps(comps, 'Semi-Detached', 2_000_000);
    expect(v.reading).toMatch(/75th percentile/);
  });

  it('says so when there is nothing to compare against', () => {
    const v = assessAgainstComps(comps, 'Other', 1_500_000);
    expect(v.band).toBeNull();
    expect(v.reading).toMatch(/cannot be checked/);
  });
});

describe('seed listings', () => {
  it('carries the three analysed properties with their real figures', async () => {
    const { seedListings } = await import('../seed');
    // crypto.randomUUID exists in node 19+; guard for older runners.
    const seeds = seedListings();
    expect(seeds.map((s) => s.address)).toEqual([
      '196 Brunswick Ave',
      '46 Brunswick Ave',
      '365 Shaw St',
      '464 Montrose Ave',
    ]);

    const b196 = seeds[0];
    expect(b196.listPrice).toBe(1_390_000);
    expect(b196.holdbackOffers).toBe(true);
    expect(b196.annualPropertyTax).toBeCloseTo(12_622.26, 2);

    const b46 = seeds[1];
    expect(b46.originalListPrice).toBe(1_888_000);
    expect(b46.priorTerminations).toBe(2);
    expect(b46.listingHistory).toHaveLength(3);
    expect(b46.propertyDaysOnMarket).toBe(27);

    const shaw = seeds[2];
    expect(shaw.soldPrice).toBe(1_435_000);

    const montrose = seeds[3];
    expect(montrose.listPrice).toBe(1_499_000);
    expect(montrose.type).toBe('Detached');
    expect(montrose.annualPropertyTax).toBe(7_274);
    expect(montrose.kitchens).toBe(2);
    // No hold-back was declared, so the offer-night band must not be applied.
    expect(montrose.holdbackOffers).toBeUndefined();
    // Bikeability is the one open gate: left unmeasured so the app warns rather
    // than scoring a distance nobody has ridden.
    expect(montrose.metresToProtectedLane).toBeUndefined();
    expect(montrose.estimatedSuiteRentMonthly).toBeUndefined();
  });

  it('gives every seed a distinct id', async () => {
    const { seedListings } = await import('../seed');
    const ids = seedListings().map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
