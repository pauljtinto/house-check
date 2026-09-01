import type { PropertyType } from './types';

/**
 * Sold comparables.
 *
 * The CSV at `public/data/comps-university-c01.csv` is the single source of
 * truth: the app fetches it at runtime, the tests read it from disk. There is
 * no second copy to drift.
 *
 * Note what this data does NOT have: square footage and lot dimensions on most
 * rows. So a $/sqft analysis is not possible from it yet, and the band below
 * falls back to a price distribution. `pricePerSqft` is computed only for rows
 * that carry a size, and the UI says when there are none.
 */

export interface Comp {
  ref: string;
  address: string;
  community: string;
  listPrice: number;
  soldPrice: number;
  soldToListPct: number;
  type: PropertyType | string;
  beds?: string;
  baths?: string;
  kitchens?: number;
  garage?: string;
  soldDate: string;
  dom?: number;
  mls?: string;
  sqft?: number;
  /** Earliest ask across all attempts, when the listing was relisted. */
  originalListPrice?: number;
  priorTerminations?: number;
  propertyDom?: number;
}

export const COMPS_CSV_PATH = '/data/comps-university-c01.csv';

function num(s: string | undefined): number | undefined {
  if (!s || !s.trim()) return undefined;
  const n = Number(s.replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

/** Parse the comps CSV. Tolerates missing trailing columns and blank cells. */
export function parseCompsCsv(text: string): Comp[] {
  const lines = text.trim().split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);

  const out: Comp[] = [];
  for (const line of lines.slice(1)) {
    const c = line.split(',');
    const listPrice = num(c[idx('list_price')]);
    const soldPrice = num(c[idx('sold_price')]);
    if (!listPrice || !soldPrice) continue;
    out.push({
      ref: c[idx('ref')]?.trim() ?? '',
      address: c[idx('address')]?.trim() ?? '',
      community: c[idx('community')]?.trim() ?? '',
      listPrice,
      soldPrice,
      soldToListPct: num(c[idx('sold_to_list_pct')]) ?? (soldPrice / listPrice) * 100,
      type: c[idx('type')]?.trim() ?? 'Other',
      beds: c[idx('br')]?.trim() || undefined,
      baths: c[idx('wr')]?.trim() || undefined,
      kitchens: num(c[idx('kit')]),
      garage: c[idx('garage')]?.trim() || undefined,
      soldDate: c[idx('sold_date')]?.trim() ?? '',
      dom: num(c[idx('dom')]),
      mls: c[idx('mls')]?.trim() || undefined,
      sqft: idx('sqft') >= 0 ? num(c[idx('sqft')]) : undefined,
      originalListPrice: idx('original_list_price') >= 0 ? num(c[idx('original_list_price')]) : undefined,
      priorTerminations: idx('prior_terminations') >= 0 ? num(c[idx('prior_terminations')]) : undefined,
      propertyDom: idx('property_dom') >= 0 ? num(c[idx('property_dom')]) : undefined,
    });
  }
  return out;
}

// --- statistics -------------------------------------------------------------

export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export interface Band {
  type: string;
  n: number;
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  /** Median $/sqft, only where the comps carry square footage. */
  medianPricePerSqft?: number;
  sqftCoverage: number;
  /** Comps whose ask was a relist after a failed attempt. */
  relistedCount: number;
}

/**
 * Fair-value band for one property type.
 *
 * Segmenting by type before averaging is not optional here: the semi median
 * ($1.5M) and the detached median ($2.425M) differ by roughly $925k, so a
 * blended figure describes no actual house.
 */
export function bandForType(comps: Comp[], type: string): Band | null {
  const subset = comps.filter((c) => c.type === type);
  if (subset.length === 0) return null;

  const prices = subset.map((c) => c.soldPrice).sort((a, b) => a - b);
  const withSqft = subset.filter((c) => c.sqft && c.sqft > 0);
  const ppsf = withSqft.map((c) => c.soldPrice / c.sqft!).sort((a, b) => a - b);

  return {
    type,
    n: subset.length,
    min: prices[0],
    p25: quantile(prices, 0.25),
    median: quantile(prices, 0.5),
    p75: quantile(prices, 0.75),
    max: prices[prices.length - 1],
    medianPricePerSqft: ppsf.length ? quantile(ppsf, 0.5) : undefined,
    sqftCoverage: subset.length ? withSqft.length / subset.length : 0,
    relistedCount: subset.filter((c) => (c.priorTerminations ?? 0) > 0).length,
  };
}

export function allBands(comps: Comp[]): Band[] {
  const types = [...new Set(comps.map((c) => c.type))];
  return types
    .map((t) => bandForType(comps, t))
    .filter((b): b is Band => b !== null)
    .sort((a, b) => b.n - a.n);
}

/** Where a price sits within a band, 0–100. */
export function percentileOf(comps: Comp[], type: string, price: number): number | null {
  const subset = comps.filter((c) => c.type === type).map((c) => c.soldPrice);
  if (subset.length === 0) return null;
  const below = subset.filter((p) => p < price).length;
  return (below / subset.length) * 100;
}

/** The comps closest in price, for a sanity check against real addresses. */
export function nearestComps(comps: Comp[], type: string, price: number, count = 4): Comp[] {
  return comps
    .filter((c) => c.type === type)
    .sort((a, b) => Math.abs(a.soldPrice - price) - Math.abs(b.soldPrice - price))
    .slice(0, count);
}

export interface CompsVerdict {
  band: Band | null;
  percentile: number | null;
  nearest: Comp[];
  /** Plain reading of where this price sits. */
  reading: string;
}

export function assessAgainstComps(comps: Comp[], type: string, price: number): CompsVerdict {
  const band = bandForType(comps, type);
  const percentile = percentileOf(comps, type, price);
  const nearest = nearestComps(comps, type, price);

  let reading: string;
  if (!band) {
    reading = `No ${type} comps in the set — this price cannot be checked against anything.`;
  } else if (band.n < 3) {
    reading =
      `Only ${band.n} ${type} comp${band.n === 1 ? '' : 's'} in the set. Not enough to form a band; ` +
      'treat any comparison as anecdote.';
  } else if (price < band.p25) {
    reading = `Below the 25th percentile of ${band.n} ${type} sales — cheap for the type, which usually means something.`;
  } else if (price <= band.median) {
    reading = `Between the 25th percentile and the median of ${band.n} ${type} sales.`;
  } else if (price <= band.p75) {
    reading = `Above the median but inside the 75th percentile of ${band.n} ${type} sales.`;
  } else {
    reading = `Above the 75th percentile of ${band.n} ${type} sales — top of the observed range for this type.`;
  }

  return { band, percentile, nearest, reading };
}
